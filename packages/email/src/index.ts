import React from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { sql } from "drizzle-orm";
import { getDb, type BookingDatabase } from "@booking/database";
import { getIntegrationMode } from "@booking/validation";
import { ConfirmationEmail } from "./template";

export { ConfirmationEmail } from "./template";

type EmailSnapshot = {
  businessName: string; businessSlug: "glamping" | "jeep"; bookingCode: string;
  customerName: string; email: string; endDate: string | null; departureTime: string | null;
  invoiceNumber: string | null; invoiceStatus: string | null; paid: number; productName: string;
  remaining: number; startDate: string; status: string;
};
const rows = <T,>(value: unknown) => value as T[];
const rupiah = (value: number) => `Rp${new Intl.NumberFormat("id-ID").format(value)}`;

async function getSnapshot(bookingId: string, database: BookingDatabase) {
  const item = rows<EmailSnapshot>(await database.execute(sql`
    select b.booking_code as "bookingCode", b.status, bu.slug as "businessSlug", bu.name as "businessName",
      b.customer_name as "customerName", b.customer_email as email,
      coalesce(g.product_name_snapshot,j.package_name_snapshot) as "productName",
      coalesce(g.check_in_date,j.tour_date)::text as "startDate", g.check_out_date::text as "endDate",
      j.departure_time_snapshot::text as "departureTime", b.verified_paid_amount::int as paid,
      b.remaining_amount::int as remaining, i.status as "invoiceStatus", i.invoice_number as "invoiceNumber"
    from bookings b join businesses bu on bu.id=b.business_id
    left join glamping_booking_details g on g.booking_id=b.id
    left join jeep_booking_details j on j.booking_id=b.id
    left join invoices i on i.booking_id=b.id where b.id=${bookingId}::uuid limit 1
  `))[0];
  if (!item || !["CONFIRMED","CHECKED_IN","CHECKED_OUT","COMPLETED"].includes(item.status)) throw new Error("Confirmation email requires a confirmed booking.");
  return item;
}

async function renderSnapshot(item: EmailSnapshot) {
  const date=(value:string)=>new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Jakarta"}).format(new Date(`${value}T00:00:00+07:00`));
  const reservation = item.endDate ? `${item.productName} · ${date(item.startDate)} hingga ${date(item.endDate)}` : `${item.productName} · ${date(item.startDate)} pukul ${item.departureTime?.slice(0,5)} WIB`;
  return render(React.createElement(ConfirmationEmail, {
    brand:item.businessSlug,businessName:item.businessName,customerName:item.customerName,
    bookingCode:item.bookingCode,reservation,paidAmount:rupiah(item.paid),remainingAmount:rupiah(item.remaining),
    invoiceState:item.invoiceStatus==="GENERATED"?"siap diunduh":"sedang disiapkan",invoiceNumber:item.invoiceNumber,
  }));
}

export async function renderBookingConfirmationPreview(bookingId: string, database: BookingDatabase = getDb()) {
  if (getIntegrationMode().emailProvider !== "preview") throw new Error("Email preview mode is not enabled.");
  return renderSnapshot(await getSnapshot(bookingId, database));
}

export async function prepareDemoEmailPreview(bookingId: string, database: BookingDatabase = getDb()) {
  const mode = getIntegrationMode();
  if (mode.appMode !== "demo" || mode.emailProvider !== "preview") throw new Error("Demo email preview is not enabled.");
  await renderSnapshot(await getSnapshot(bookingId, database));
  const inserted = rows<{id:string}>(await database.execute(sql`
    insert into booking_events (booking_id,event_type,actor_type,title,metadata)
    select ${bookingId}::uuid,'EMAIL_SENT','SYSTEM','Pratinjau email konfirmasi siap',${JSON.stringify({provider:"PREVIEW",delivered:false})}::jsonb
    where not exists (select 1 from booking_events where booking_id=${bookingId}::uuid and event_type='EMAIL_SENT') returning id
  `));
  return {duplicate:inserted.length===0,delivered:false,provider:"PREVIEW" as const};
}

export async function sendBookingConfirmation(bookingId: string, database: BookingDatabase = getDb()) {
  const item = await getSnapshot(bookingId, database);
  const sent = rows<{exists:boolean}>(await database.execute(sql`select exists(select 1 from booking_events where booking_id=${bookingId}::uuid and event_type='EMAIL_SENT') as exists`))[0];
  if (sent?.exists) return {duplicate:true};
  const apiKey=process.env.RESEND_API_KEY,from=process.env.RESEND_FROM_EMAIL;
  if(!apiKey||!from)throw new Error("Resend email is not configured.");
  const html=await renderSnapshot(item);
  const resend=new Resend(apiKey);
  const {data,error}=await resend.emails.send({from,to:item.email,subject:`Reservasi ${item.bookingCode} dikonfirmasi`,html},{idempotencyKey:`booking-confirmed/${bookingId}`});
  if(error)throw new Error(`Resend delivery failed: ${error.name}`);
  await database.execute(sql`insert into booking_events (booking_id,event_type,actor_type,title,metadata) values (${bookingId}::uuid,'EMAIL_SENT','BACKGROUND_JOB','Email konfirmasi terkirim',${JSON.stringify({provider:"RESEND",providerMessageId:data?.id??null})}::jsonb)`);
  return {duplicate:false,messageId:data?.id};
}

export function prepareConfirmationEmail(bookingId: string, database: BookingDatabase = getDb()) {
  return getIntegrationMode().emailProvider === "preview" ? prepareDemoEmailPreview(bookingId,database) : sendBookingConfirmation(bookingId,database);
}
