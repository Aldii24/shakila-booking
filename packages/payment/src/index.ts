import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { DomainError } from "@booking/booking";
import { getDb, type BookingDatabase } from "@booking/database";
import { getIntegrationMode } from "@booking/validation";
import { initiateDemoPayment } from "./demo";

export { completeDemoPayment, failDemoPayment, initiateDemoPayment } from "./demo";

const rows = <T>(value: unknown) => value as T[];

export const pakasirWebhookSchema = z.object({
  amount: z.number().int().nonnegative(), order_id: z.string().min(1).max(160), project: z.string().min(1),
  status: z.string().min(1), payment_method: z.string().min(1), completed_at: z.string().min(1),
});
const pakasirDetailSchema = z.object({ transaction: z.object({
  amount: z.number().int().nonnegative(), order_id: z.string(), project: z.string(), status: z.string(),
  payment_method: z.string(), completed_at: z.string().nullable().optional(),
}) });
export type VerifiedProviderPayment = { amount:number;orderId:string;project:string;status:string;paymentMethod:string;completedAt:string|null };
export type PakasirConfig = { project:string;apiKey:string;baseUrl:string };

export function getPakasirConfig():PakasirConfig {
  const project=process.env.PAKASIR_PROJECT_SLUG,apiKey=process.env.PAKASIR_API_KEY;
  if(!project||!apiKey) throw new DomainError("PAYMENT_NOT_CONFIGURED","Payment provider is not configured.",503);
  return {project,apiKey,baseUrl:process.env.PAKASIR_BASE_URL??"https://app.pakasir.com"};
}
export function buildPakasirCheckoutUrl(input:{project:string;amount:number;orderId:string;redirectUrl?:string}) {
  const url=new URL(`/pay/${encodeURIComponent(input.project)}/${input.amount}`,"https://app.pakasir.com");
  url.searchParams.set("order_id",input.orderId); if(input.redirectUrl)url.searchParams.set("redirect",input.redirectUrl); return url.toString();
}
export async function fetchPakasirTransaction(orderId:string,amount:number,config=getPakasirConfig()):Promise<VerifiedProviderPayment>{
  const url=new URL("/api/transactiondetail",config.baseUrl); url.searchParams.set("project",config.project);url.searchParams.set("amount",String(amount));url.searchParams.set("order_id",orderId);url.searchParams.set("api_key",config.apiKey);
  const response=await fetch(url,{headers:{Accept:"application/json"},cache:"no-store"});
  if(!response.ok)throw new DomainError("PAYMENT_VERIFICATION_FAILED","Payment status could not be verified yet.",502);
  const {transaction}=pakasirDetailSchema.parse(await response.json());
  return {amount:transaction.amount,orderId:transaction.order_id,project:transaction.project,status:transaction.status,paymentMethod:transaction.payment_method,completedAt:transaction.completed_at??null};
}
export function evaluateVerifiedPayment(expected:{amount:number;orderId:string;project:string},actual:VerifiedProviderPayment){
  if(actual.project!==expected.project||actual.orderId!==expected.orderId||actual.amount!==expected.amount)return {accepted:false as const,reason:"PAYMENT_AMOUNT_OR_REFERENCE_MISMATCH" as const};
  if(actual.status!=="completed")return {accepted:false as const,reason:"PAYMENT_NOT_COMPLETED" as const}; return {accepted:true as const};
}

export async function initiatePakasirPayment(bookingCode:string,bookingId:string,database:BookingDatabase=getDb()){
  const config=getPakasirConfig();
  return database.transaction(async tx=>{
    const found=rows<{paymentId:string;status:string;expectedAmount:number;expiresAt:string|null}>(await tx.execute(sql`select p.id as "paymentId",b.status,p.expected_amount::int as "expectedAmount",b.expires_at::text as "expiresAt" from bookings b join payments p on p.booking_id=b.id where b.id=${bookingId}::uuid and b.booking_code=${bookingCode} for update of b,p`))[0];
    if(!found)throw new DomainError("BOOKING_NOT_FOUND","Booking was not found.",404);
    if(found.status!=="WAITING_PAYMENT"||!found.expiresAt||Date.parse(found.expiresAt)<=Date.now())throw new DomainError("BOOKING_STATE_CONFLICT","Booking hold is no longer active.",409);
    const active=rows<{orderId:string}>(await tx.execute(sql`select provider_order_id as "orderId" from payment_attempts where booking_id=${bookingId}::uuid and provider='PAKASIR' and status in ('CREATED','PENDING') order by created_at desc limit 1`))[0];
    const orderId=active?.orderId??`${bookingCode}-${randomUUID().slice(0,8).toUpperCase()}`;
    if(!active){
      await tx.execute(sql`insert into payment_attempts (payment_id,booking_id,provider,provider_order_id,requested_amount,status,payment_method) values (${found.paymentId}::uuid,${bookingId}::uuid,'PAKASIR',${orderId},${found.expectedAmount},'PENDING','provider_checkout')`);
      await tx.execute(sql`update payments set status='PENDING',updated_at=now() where id=${found.paymentId}::uuid`);await tx.execute(sql`update bookings set payment_status='PENDING',updated_at=now() where id=${bookingId}::uuid`);
      await tx.execute(sql`insert into booking_events (booking_id,event_type,actor_type,title,metadata) values (${bookingId}::uuid,'PAYMENT_CREATED','CUSTOMER','Pakasir payment initiated',${JSON.stringify({orderId})}::jsonb)`);
    }
    const base=process.env.PAKASIR_REDIRECT_BASE_URL;const redirectUrl=base?new URL(`/booking/payment?bookingCode=${encodeURIComponent(bookingCode)}`,base).toString():undefined;
    return {provider:"PAKASIR" as const,orderId,amount:found.expectedAmount,expiresAt:found.expiresAt,checkoutUrl:buildPakasirCheckoutUrl({project:config.project,amount:found.expectedAmount,orderId,redirectUrl})};
  });
}

export async function initiatePayment(
  bookingCode: string,
  bookingId: string,
  database: BookingDatabase = getDb(),
) {
  const mode = getIntegrationMode();
  if (mode.paymentProvider === "demo") {
    if (mode.appMode !== "demo") {
      throw new DomainError("PAYMENT_NOT_CONFIGURED", "Demo payment requires APP_MODE=demo.", 503);
    }
    return initiateDemoPayment(bookingCode, bookingId, database);
  }
  return initiatePakasirPayment(bookingCode, bookingId, database);
}

export async function applyVerifiedPakasirPayment(actual:VerifiedProviderPayment,database:BookingDatabase=getDb()){
  const config=getPakasirConfig();
  return database.transaction(async tx=>{
    const a=rows<{attemptId:string;bookingId:string;paymentId:string;requestedAmount:number;attemptStatus:string;bookingStatus:string;expiresAt:string|null;requiredDp:number;total:number;verifiedPaid:number}>(await tx.execute(sql`select a.id as "attemptId",a.booking_id as "bookingId",a.payment_id as "paymentId",a.requested_amount::int as "requestedAmount",a.status as "attemptStatus",b.status as "bookingStatus",b.expires_at::text as "expiresAt",b.required_dp_amount::int as "requiredDp",b.total_amount::int as total,b.verified_paid_amount::int as "verifiedPaid" from payment_attempts a join bookings b on b.id=a.booking_id where a.provider='PAKASIR' and a.provider_order_id=${actual.orderId} for update of a,b`))[0];
    if(!a)throw new DomainError("BOOKING_NOT_FOUND","Payment attempt was not found.",404);
    if(a.attemptStatus==="SUCCESS")return {bookingId:a.bookingId,status:a.bookingStatus,duplicate:true,accepted:true};
    const verdict=evaluateVerifiedPayment({amount:a.requestedAmount,orderId:actual.orderId,project:config.project},actual);
    if(!verdict.accepted){
      await tx.execute(sql`update payment_attempts set status='EXCEPTION',verified_amount=${actual.amount},raw_reference=${verdict.reason},verified_at=now(),updated_at=now() where id=${a.attemptId}::uuid`);await tx.execute(sql`update bookings set requires_review=true,updated_at=now() where id=${a.bookingId}::uuid`);
      await tx.execute(sql`insert into booking_events (booking_id,event_type,actor_type,title,metadata) values (${a.bookingId}::uuid,'PAYMENT_EXCEPTION','PAYMENT_PROVIDER','Payment requires review',${JSON.stringify({reason:verdict.reason,orderId:actual.orderId})}::jsonb)`);return {bookingId:a.bookingId,status:a.bookingStatus,requiresReview:true,accepted:false};
    }
    const paidAt=actual.completedAt?new Date(actual.completedAt):new Date();const holdElapsed=!a.expiresAt||Date.parse(a.expiresAt)<paidAt.getTime()||a.bookingStatus==="EXPIRED";
    await tx.execute(sql`update payment_attempts set status='SUCCESS',verified_amount=${actual.amount},payment_method=${actual.paymentMethod},provider_paid_at=${paidAt.toISOString()}::timestamptz,verified_at=now(),updated_at=now() where id=${a.attemptId}::uuid`);
    if(holdElapsed){
      await tx.execute(sql`update bookings set requires_review=true,verified_paid_amount=${a.verifiedPaid+actual.amount},remaining_amount=greatest(total_amount-${a.verifiedPaid+actual.amount},0),updated_at=now() where id=${a.bookingId}::uuid`);await tx.execute(sql`update payments set verified_amount=verified_amount+${actual.amount},status='PARTIALLY_PAID',verified_at=now(),updated_at=now() where id=${a.paymentId}::uuid`);
      await tx.execute(sql`insert into booking_events (booking_id,event_type,actor_type,title,metadata) values (${a.bookingId}::uuid,'PAYMENT_EXCEPTION','PAYMENT_PROVIDER','Late payment requires review',${JSON.stringify({orderId:actual.orderId})}::jsonb)`);return {bookingId:a.bookingId,status:a.bookingStatus,requiresReview:true,accepted:true};
    }
    const newVerified=a.verifiedPaid+actual.amount,paymentStatus=newVerified>=a.total?"PAID":"PARTIALLY_PAID",confirmed=newVerified>=a.requiredDp;
    await tx.execute(sql`update payments set verified_amount=${newVerified},status=${paymentStatus},verified_at=now(),updated_at=now() where id=${a.paymentId}::uuid`);await tx.execute(sql`update bookings set verified_paid_amount=${newVerified},remaining_amount=greatest(total_amount-${newVerified},0),payment_status=${paymentStatus},status=case when ${confirmed} then 'CONFIRMED' else status end,confirmed_at=case when ${confirmed} then coalesce(confirmed_at,now()) else confirmed_at end,updated_at=now() where id=${a.bookingId}::uuid`);
    if(confirmed){
      await tx.execute(sql`update accommodation_unit_reservations set state='CONFIRMED',updated_at=now() where booking_id=${a.bookingId}::uuid and state='HELD'`);await tx.execute(sql`update jeep_unit_reservations set state='CONFIRMED',updated_at=now() where booking_id=${a.bookingId}::uuid and state='HELD'`);
      const invoiceNumber=`INV-${actual.orderId.split("-").slice(0,3).join("-")}`,remaining=Math.max(a.total-newVerified,0);await tx.execute(sql`insert into invoices (booking_id,invoice_number,status,total_amount,paid_amount,remaining_amount,issued_at) values (${a.bookingId}::uuid,${invoiceNumber},'PENDING',${a.total},${newVerified},${remaining},now()) on conflict (booking_id) do nothing`);
      await tx.execute(sql`insert into booking_events (booking_id,event_type,actor_type,title,metadata) values (${a.bookingId}::uuid,'PAYMENT_VERIFIED','PAYMENT_PROVIDER','Required DP verified',${JSON.stringify({orderId:actual.orderId,amount:actual.amount})}::jsonb)`);await tx.execute(sql`insert into booking_events (booking_id,event_type,actor_type,title) values (${a.bookingId}::uuid,'BOOKING_CONFIRMED','SYSTEM','Booking confirmed')`);
    }
    return {bookingId:a.bookingId,status:confirmed?"CONFIRMED":a.bookingStatus,accepted:true,duplicate:false};
  });
}
export async function verifyPakasirOrder(orderId:string,database:BookingDatabase=getDb()){
  const a=rows<{amount:number}>(await database.execute(sql`select requested_amount::int as amount from payment_attempts where provider='PAKASIR' and provider_order_id=${orderId} limit 1`))[0];if(!a)throw new DomainError("BOOKING_NOT_FOUND","Payment attempt was not found.",404);return applyVerifiedPakasirPayment(await fetchPakasirTransaction(orderId,a.amount),database);
}
export async function verifyLatestPakasirPayment(bookingId:string,database:BookingDatabase=getDb()){
  const a=rows<{orderId:string}>(await database.execute(sql`select provider_order_id as "orderId" from payment_attempts where booking_id=${bookingId}::uuid and provider='PAKASIR' and status='PENDING' order by created_at desc limit 1`))[0];
  if(!a)return null;return verifyPakasirOrder(a.orderId,database);
}
export async function handlePakasirWebhook(payload:unknown,database:BookingDatabase=getDb()){
  const webhook=pakasirWebhookSchema.parse(payload),config=getPakasirConfig();if(webhook.project!==config.project)throw new DomainError("UNAUTHORIZED","Unknown payment project.",401);return verifyPakasirOrder(webhook.order_id,database);
}
