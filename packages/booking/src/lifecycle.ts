import { sql } from "drizzle-orm";
import { getDb, type BookingDatabase } from "@booking/database";
import { businessDate, validateBookingTransition } from "./core";
import { DomainError } from "./errors";

type LifecycleOptions = { confirmEarlyCheckout?: boolean };

async function mutate(bookingId: string, action: "expire"|"cancel"|"checkIn"|"checkOut", database: BookingDatabase, options: LifecycleOptions = {}) {
  return database.transaction(async tx => {
    const rows=await tx.execute(sql<{status: "WAITING_PAYMENT"|"CONFIRMED"|"CHECKED_IN"; payment_status:string; verified_paid_amount:number; required_dp_amount:number; reservation_date:string; end_date:string; timezone:string; expires_at:string|null}>`select b.status,b.payment_status,b.verified_paid_amount::int,b.required_dp_amount::int,coalesce(bd.check_in_date,g.check_in_date,j.tour_date)::text reservation_date,coalesce(bd.check_out_date,g.check_out_date,j.tour_date)::text end_date,bu.timezone,b.expires_at::text from bookings b join businesses bu on bu.id=b.business_id left join bundle_booking_details bd on bd.booking_id=b.id left join glamping_booking_details g on g.booking_id=b.id left join jeep_booking_details j on j.booking_id=b.id where b.id=${bookingId}::uuid for update of b`) as unknown as {status:"WAITING_PAYMENT"|"CONFIRMED"|"CHECKED_IN";payment_status:string;verified_paid_amount:number;required_dp_amount:number;reservation_date:string;end_date:string;timezone:string;expires_at:string|null}[];
    const item=rows[0]; if(!item) throw new DomainError("BOOKING_NOT_FOUND","Booking was not found.",404);
    const target=action==="expire"?"EXPIRED":action==="cancel"?"CANCELLED":action==="checkIn"?"CHECKED_IN":"CHECKED_OUT";
    validateBookingTransition(item.status,target);
    if(action==="expire" && (item.status!=="WAITING_PAYMENT" || !item.expires_at || Date.parse(item.expires_at)>Date.now())) throw new DomainError("BOOKING_STATE_CONFLICT","Only elapsed waiting-payment bookings can expire.",409);
    if(action==="checkIn" && (item.status!=="CONFIRMED" || item.verified_paid_amount<item.required_dp_amount || item.reservation_date!==businessDate(item.timezone))) throw new DomainError("CHECK_IN_NOT_ALLOWED","Booking does not meet check-in requirements.",409);
    const earlyCheckout = action === "checkOut" && item.end_date > businessDate(item.timezone);
    if(earlyCheckout && !options.confirmEarlyCheckout) throw new DomainError("CHECK_OUT_NOT_ALLOWED","Early checkout requires explicit admin confirmation.",409);
    const state=action==="checkIn"?"IN_USE":"RELEASED"; const event=action==="expire"?"BOOKING_EXPIRED":action==="cancel"?"BOOKING_CANCELLED":action==="checkIn"?"CHECKED_IN":"CHECKED_OUT";
    const stamp=action==="expire"?sql`expires_at`:action==="cancel"?sql`cancelled_at`:action==="checkIn"?sql`checked_in_at`:sql`checked_out_at`;
    await tx.execute(sql`update bookings set status=${target}, ${stamp}=now(), updated_at=now() where id=${bookingId}::uuid`);
    if(action==="expire") { await tx.execute(sql`update bookings set payment_status='EXPIRED' where id=${bookingId}::uuid`); await tx.execute(sql`update payments set status='EXPIRED',updated_at=now() where booking_id=${bookingId}::uuid and verified_amount=0`); }
    await tx.execute(sql`update accommodation_unit_reservations set state=${state}, released_at=case when ${state}='RELEASED' then now() else null end, updated_at=now() where booking_id=${bookingId}::uuid and state in ('HELD','CONFIRMED','IN_USE')`);
    await tx.execute(sql`update jeep_unit_reservations set state=${state}, released_at=case when ${state}='RELEASED' then now() else null end, updated_at=now() where booking_id=${bookingId}::uuid and state in ('HELD','CONFIRMED','IN_USE')`);
    await tx.execute(sql`insert into booking_events (booking_id,event_type,actor_type,title,metadata) values (${bookingId}::uuid,${event},'SYSTEM',${event.replaceAll("_"," ")},${JSON.stringify(earlyCheckout ? { earlyCheckout: true, scheduledEndDate: item.end_date } : {})}::jsonb)`);
    return {bookingId,status:target};
  });
}
export const expireBooking=(id:string,db:BookingDatabase=getDb())=>mutate(id,"expire",db);
export const cancelBooking=(id:string,db:BookingDatabase=getDb())=>mutate(id,"cancel",db);
export const checkInBooking=(id:string,db:BookingDatabase=getDb())=>mutate(id,"checkIn",db);
export const checkOutBooking=(id:string,db:BookingDatabase=getDb(),options:LifecycleOptions={})=>mutate(id,"checkOut",db,options);

export async function expireDueBookings(database:BookingDatabase=getDb()){
  const due=await database.execute(sql<{id:string}>`select id from bookings where status='WAITING_PAYMENT' and expires_at<=now() order by expires_at limit 100`) as unknown as {id:string}[];
  const expired:string[]=[];for(const booking of due){try{await expireBooking(booking.id,database);expired.push(booking.id);}catch(error){if(!(error instanceof DomainError&&error.code==="BOOKING_STATE_CONFLICT"))throw error;}}return {expiredCount:expired.length,bookingIds:expired};
}
