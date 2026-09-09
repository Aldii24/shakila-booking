import { sql } from "drizzle-orm";
import { getDb, type BookingDatabase } from "@booking/database";
import { businessDate, isAccommodationCheckInOpen, validateBookingTransition } from "./core";
import { DomainError } from "./errors";

type LifecycleOptions = { confirmEarlyCheckout?: boolean; instant?: Date };

async function mutate(bookingId: string, action: "expire"|"cancel"|"checkIn"|"checkOut"|"completeJeep", database: BookingDatabase, options: LifecycleOptions = {}) {
  return database.transaction(async tx => {
    const rows=await tx.execute(sql<{status: "WAITING_PAYMENT"|"CONFIRMED"|"CHECKED_IN"; booking_type:string; payment_status:string; verified_paid_amount:number; total_amount:number; remaining_amount:number; reservation_date:string; end_date:string; timezone:string; expires_at:string|null}>`select b.status,b.booking_type,b.payment_status,b.verified_paid_amount::int,b.total_amount::int,b.remaining_amount::int,coalesce(bd.check_in_date,g.check_in_date,j.tour_date)::text reservation_date,coalesce(bd.check_out_date,g.check_out_date,j.tour_date)::text end_date,bu.timezone,b.expires_at::text from bookings b join businesses bu on bu.id=b.business_id left join bundle_booking_details bd on bd.booking_id=b.id left join glamping_booking_details g on g.booking_id=b.id left join jeep_booking_details j on j.booking_id=b.id where b.id=${bookingId}::uuid for update of b`) as unknown as {status:"WAITING_PAYMENT"|"CONFIRMED"|"CHECKED_IN";booking_type:string;payment_status:string;verified_paid_amount:number;total_amount:number;remaining_amount:number;reservation_date:string;end_date:string;timezone:string;expires_at:string|null}[];
    const item=rows[0]; if(!item) throw new DomainError("BOOKING_NOT_FOUND","Booking was not found.",404);
    const target=action==="expire"?"EXPIRED":action==="cancel"?"CANCELLED":action==="checkIn"?"CHECKED_IN":action==="checkOut"?"CHECKED_OUT":"COMPLETED";
    if((action==="checkIn" || action==="checkOut") && item.booking_type==="JEEP") throw new DomainError("BOOKING_LIFECYCLE_NOT_ALLOWED","Booking Jeep tidak menggunakan Check-In atau Check-Out.",409);
    validateBookingTransition(item.status,target);
    if(action==="expire" && (item.status!=="WAITING_PAYMENT" || !item.expires_at || Date.parse(item.expires_at)>Date.now())) throw new DomainError("BOOKING_STATE_CONFLICT","Only elapsed waiting-payment bookings can expire.",409);
    if(action==="completeJeep" && item.booking_type!=="JEEP") throw new DomainError("BOOKING_LIFECYCLE_NOT_ALLOWED","Tindakan Selesai hanya tersedia untuk booking Jeep.",409);
    if(action==="completeJeep" && item.status!=="CONFIRMED") throw new DomainError("BOOKING_STATE_CONFLICT","Hanya booking Jeep terkonfirmasi yang dapat diselesaikan.",409);
    if(action==="completeJeep" && (item.payment_status!=="PAID" || item.remaining_amount!==0 || item.verified_paid_amount<item.total_amount)) throw new DomainError("PAYMENT_BALANCE_REMAINING","Booking Jeep harus lunas sebelum ditandai selesai.",409);
    const checkInDateOpen = isAccommodationCheckInOpen(
      item.reservation_date,
      item.timezone,
      options.instant,
    );
    if(action==="checkIn" && item.status!=="CONFIRMED") throw new DomainError("CHECK_IN_NOT_ALLOWED","Only confirmed bookings can be checked in.",409);
    if(action==="checkIn" && (item.payment_status!=="PAID" || item.remaining_amount!==0 || item.verified_paid_amount<item.total_amount)) throw new DomainError("PAYMENT_BALANCE_REMAINING","Booking must be paid in full before check-in.",409);
    if(action==="checkIn" && !checkInDateOpen) throw new DomainError("CHECK_IN_NOT_ALLOWED","Check-in opens at 13:00 in the business timezone on the reservation date.",409);
    const earlyCheckout = action === "checkOut" && item.end_date > businessDate(item.timezone);
    if(earlyCheckout && !options.confirmEarlyCheckout) throw new DomainError("CHECK_OUT_NOT_ALLOWED","Early checkout requires explicit admin confirmation.",409);
    const state=action==="checkIn"?"IN_USE":"RELEASED"; const event=action==="expire"?"BOOKING_EXPIRED":action==="cancel"?"BOOKING_CANCELLED":action==="checkIn"?"CHECKED_IN":action==="checkOut"?"CHECKED_OUT":"BOOKING_COMPLETED";
    const stamp=action==="expire"?sql`expires_at`:action==="cancel"?sql`cancelled_at`:action==="checkIn"?sql`checked_in_at`:action==="checkOut"?sql`checked_out_at`:sql`completed_at`;
    await tx.execute(sql`update bookings set status=${target}, ${stamp}=now(), updated_at=now() where id=${bookingId}::uuid`);
    if(action==="expire") { await tx.execute(sql`update bookings set payment_status='EXPIRED' where id=${bookingId}::uuid`); await tx.execute(sql`update payments set status='EXPIRED',updated_at=now() where booking_id=${bookingId}::uuid and verified_amount=0`); }
    if(action==="cancel") {
      await tx.execute(sql`update payment_attempts set status='CANCELLED',raw_reference='Booking dibatalkan sebelum bukti diverifikasi',updated_at=now() where booking_id=${bookingId}::uuid and status in ('CREATED','PENDING')`);
      await tx.execute(sql`update payment_proofs set status='REJECTED',rejection_reason=coalesce(rejection_reason,'Booking dibatalkan sebelum bukti diverifikasi'),verified_at=now(),updated_at=now() where booking_id=${bookingId}::uuid and status='PENDING'`);
      await tx.execute(sql`update bookings set payment_status='UNPAID' where id=${bookingId}::uuid and verified_paid_amount=0 and payment_status='PENDING'`);
      await tx.execute(sql`update payments set status='UNPAID',updated_at=now() where booking_id=${bookingId}::uuid and verified_amount=0 and status='PENDING'`);
    }
    await tx.execute(sql`update accommodation_unit_reservations set state=${state}, released_at=case when ${state}='RELEASED' then now() else null end, updated_at=now() where booking_id=${bookingId}::uuid and state in ('HELD','CONFIRMED','IN_USE')`);
    await tx.execute(sql`update jeep_unit_reservations set state=${state}, released_at=case when ${state}='RELEASED' then now() else null end, updated_at=now() where booking_id=${bookingId}::uuid and state in ('HELD','CONFIRMED','IN_USE')`);
    await tx.execute(sql`insert into booking_events (booking_id,event_type,actor_type,title,metadata) values (${bookingId}::uuid,${event},'SYSTEM',${event.replaceAll("_"," ")},${JSON.stringify(earlyCheckout ? { earlyCheckout: true, scheduledEndDate: item.end_date } : {})}::jsonb)`);
    return {bookingId,status:target};
  });
}
export const expireBooking=(id:string,db:BookingDatabase=getDb())=>mutate(id,"expire",db);
export const cancelBooking=(id:string,db:BookingDatabase=getDb())=>mutate(id,"cancel",db);
export const checkInBooking=(id:string,db:BookingDatabase=getDb(),options:LifecycleOptions={})=>mutate(id,"checkIn",db,options);
export const checkOutBooking=(id:string,db:BookingDatabase=getDb(),options:LifecycleOptions={})=>mutate(id,"checkOut",db,options);
export const completeJeepBooking=(id:string,db:BookingDatabase=getDb())=>mutate(id,"completeJeep",db);

export async function expireDueBookings(database:BookingDatabase=getDb()){
  const due=await database.execute(sql<{id:string}>`select id from bookings where status='WAITING_PAYMENT' and expires_at<=now() order by expires_at limit 100`) as unknown as {id:string}[];
  const expired:string[]=[];for(const booking of due){try{await expireBooking(booking.id,database);expired.push(booking.id);}catch(error){if(!(error instanceof DomainError&&error.code==="BOOKING_STATE_CONFLICT"))throw error;}}return {expiredCount:expired.length,bookingIds:expired};
}
