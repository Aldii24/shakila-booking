import { sql } from "drizzle-orm";
import { DomainError } from "@booking/booking";
import { getDb, type BookingDatabase } from "@booking/database";

const rows = <T>(value: unknown) => value as T[];

export const manualSettlementMethods = [
  "CASH",
  "TRANSFER",
  "MANUAL_QRIS",
  "OTHER",
] as const;

export type ManualSettlementMethod = (typeof manualSettlementMethods)[number];

type SettlementState = {
  bookingId: string;
  bookingCode: string;
  status: string;
  paymentStatus: string;
  verifiedPaidAmount: number;
  remainingAmount: number;
};

export function evaluateManualSettlement(input: {
  currentVerified: number;
  amount: number;
  totalAmount: number;
  requiredDp: number;
}) {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new DomainError(
      "INVALID_PAYMENT_AMOUNT",
      "Settlement amount must be a positive rupiah value.",
      400,
    );
  }
  const remainingAmount = Math.max(input.totalAmount - input.currentVerified, 0);
  if (remainingAmount === 0) {
    throw new DomainError("BOOKING_ALREADY_PAID", "Booking is already paid in full.", 409);
  }
  if (input.amount > remainingAmount) {
    throw new DomainError(
      "INVALID_PAYMENT_AMOUNT",
      "Settlement amount cannot exceed the remaining balance.",
      409,
    );
  }
  const verifiedPaidAmount = input.currentVerified + input.amount;
  const nextRemainingAmount = input.totalAmount - verifiedPaidAmount;
  return {
    verifiedPaidAmount,
    remainingAmount: nextRemainingAmount,
    paymentStatus: nextRemainingAmount === 0 ? ("PAID" as const) : ("PARTIALLY_PAID" as const),
    dpSatisfied: verifiedPaidAmount >= input.requiredDp,
  };
}

export async function recordManualSettlement(
  bookingCode: string,
  input: {
    amount: number;
    method: ManualSettlementMethod;
    note?: string;
    idempotencyKey: string;
  },
  adminEmail: string,
  database: BookingDatabase = getDb(),
) {
  const orderId = `admin-settlement:${input.idempotencyKey}`;
  return database.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${orderId}))`);
    const duplicate = rows<SettlementState & { requestedAmount: number; paymentMethod: string | null; note: string | null }>(await tx.execute(sql`
      select b.id as "bookingId",b.booking_code as "bookingCode",b.status,
        b.payment_status as "paymentStatus",b.verified_paid_amount::int as "verifiedPaidAmount",
        b.remaining_amount::int as "remainingAmount",a.requested_amount::int as "requestedAmount",
        a.payment_method as "paymentMethod",a.raw_reference as note
      from payment_attempts a join bookings b on b.id=a.booking_id
      where a.provider='MANUAL_ADMIN' and a.provider_order_id=${orderId}
      limit 1
    `))[0];
    if (duplicate) {
      const note = input.note?.trim() || null;
      if (duplicate.bookingCode !== bookingCode || duplicate.requestedAmount !== input.amount || duplicate.paymentMethod !== input.method || duplicate.note !== note) {
        throw new DomainError("IDEMPOTENCY_CONFLICT", "Idempotency key is already in use.", 409);
      }
      return { ...duplicate, duplicate: true, invoiceNeedsRefresh: false };
    }

    const booking = rows<SettlementState & { paymentId: string; totalAmount: number; requiredDp: number }>(await tx.execute(sql`
      select b.id as "bookingId",b.booking_code as "bookingCode",b.status,
        b.payment_status as "paymentStatus",b.total_amount::int as "totalAmount",b.required_dp_amount::int as "requiredDp",
        b.verified_paid_amount::int as "verifiedPaidAmount",b.remaining_amount::int as "remainingAmount",
        p.id as "paymentId"
      from bookings b join payments p on p.booking_id=b.id
      where b.booking_code=${bookingCode}
      for update of b,p
    `))[0];
    if (!booking) throw new DomainError("BOOKING_NOT_FOUND", "Booking was not found.", 404);
    if (!["WAITING_PAYMENT", "CONFIRMED"].includes(booking.status)) {
      throw new DomainError(
        "BOOKING_STATE_CONFLICT",
        "Only bookings awaiting payment or already confirmed can receive an Admin payment.",
        409,
      );
    }

    const decision = evaluateManualSettlement({
      currentVerified: booking.verifiedPaidAmount,
      amount: input.amount,
      totalAmount: booking.totalAmount,
      requiredDp: booking.requiredDp,
    });
    const bookingStatus = decision.dpSatisfied ? "CONFIRMED" : "WAITING_PAYMENT";
    const confirmedNow = booking.status === "WAITING_PAYMENT" && decision.dpSatisfied;
    const note = input.note?.trim() || null;
    await tx.execute(sql`
      insert into payment_attempts(
        payment_id,booking_id,provider,provider_order_id,provider_transaction_id,
        requested_amount,verified_amount,status,payment_method,provider_paid_at,
        raw_reference,verified_at
      ) values (
        ${booking.paymentId}::uuid,${booking.bookingId}::uuid,'MANUAL_ADMIN',${orderId},
        ${input.idempotencyKey},${input.amount},${input.amount},'SUCCESS',${input.method},now(),
        ${note},now()
      )
    `);
    await tx.execute(sql`
      update payments set verified_amount=${decision.verifiedPaidAmount},
        status=${decision.paymentStatus},verified_at=now(),updated_at=now()
      where id=${booking.paymentId}::uuid
    `);
    await tx.execute(sql`
      update bookings set verified_paid_amount=${decision.verifiedPaidAmount},
        remaining_amount=${decision.remainingAmount},payment_status=${decision.paymentStatus},status=${bookingStatus}::booking_status,
        confirmed_at=case when ${confirmedNow} then coalesce(confirmed_at,now()) else confirmed_at end,updated_at=now()
      where id=${booking.bookingId}::uuid
    `);
    if (confirmedNow) {
      await tx.execute(sql`update accommodation_unit_reservations set state='CONFIRMED',updated_at=now() where booking_id=${booking.bookingId}::uuid and state='HELD'`);
      await tx.execute(sql`update jeep_unit_reservations set state='CONFIRMED',updated_at=now() where booking_id=${booking.bookingId}::uuid and state='HELD'`);
    }
    if (decision.dpSatisfied) await tx.execute(sql`
      insert into invoices(booking_id,invoice_number,status,total_amount,paid_amount,remaining_amount,issued_at)
      values (${booking.bookingId}::uuid,${`INV-${booking.bookingCode}`},'PENDING',${booking.totalAmount},${decision.verifiedPaidAmount},${decision.remainingAmount},now())
      on conflict(booking_id) do update set paid_amount=excluded.paid_amount,remaining_amount=excluded.remaining_amount,status='PENDING',updated_at=now()
    `);
    await tx.execute(sql`
      insert into booking_events(booking_id,event_type,actor_type,title,description,metadata)
      values (${booking.bookingId}::uuid,'PAYMENT_VERIFIED','ADMIN',${booking.status === "CONFIRMED" ? "Pelunasan dicatat" : "Pembayaran tambahan dicatat"},${note},
        ${JSON.stringify({
          amount: input.amount,
          method: input.method,
          paymentStatus: decision.paymentStatus,
          remainingAmount: decision.remainingAmount,
          adminEmail,
          idempotencyKey: input.idempotencyKey,
        })}::jsonb)
    `);
    if (confirmedNow) await tx.execute(sql`
      insert into booking_events(booking_id,event_type,actor_type,title,metadata)
      values (${booking.bookingId}::uuid,'BOOKING_CONFIRMED','SYSTEM','Booking dikonfirmasi setelah DP terverifikasi',${JSON.stringify({ source: "MANUAL_ADMIN" })}::jsonb)
    `);
    return {
      bookingId: booking.bookingId,
      bookingCode: booking.bookingCode,
      status: bookingStatus,
      ...decision,
      duplicate: false,
      invoiceNeedsRefresh: decision.dpSatisfied,
    };
  });
}
