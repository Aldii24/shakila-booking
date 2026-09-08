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
    const duplicate = rows<SettlementState>(await tx.execute(sql`
      select b.id as "bookingId",b.booking_code as "bookingCode",b.status,
        b.payment_status as "paymentStatus",b.verified_paid_amount::int as "verifiedPaidAmount",
        b.remaining_amount::int as "remainingAmount"
      from payment_attempts a join bookings b on b.id=a.booking_id
      where a.provider='MANUAL_ADMIN' and a.provider_order_id=${orderId}
      limit 1
    `))[0];
    if (duplicate) {
      if (duplicate.bookingCode !== bookingCode) {
        throw new DomainError("IDEMPOTENCY_CONFLICT", "Idempotency key is already in use.", 409);
      }
      return { ...duplicate, duplicate: true, invoiceNeedsRefresh: false };
    }

    const booking = rows<SettlementState & { paymentId: string; totalAmount: number }>(await tx.execute(sql`
      select b.id as "bookingId",b.booking_code as "bookingCode",b.status,
        b.payment_status as "paymentStatus",b.total_amount::int as "totalAmount",
        b.verified_paid_amount::int as "verifiedPaidAmount",b.remaining_amount::int as "remainingAmount",
        p.id as "paymentId"
      from bookings b join payments p on p.booking_id=b.id
      where b.booking_code=${bookingCode}
      for update of b,p
    `))[0];
    if (!booking) throw new DomainError("BOOKING_NOT_FOUND", "Booking was not found.", 404);
    if (booking.status !== "CONFIRMED") {
      throw new DomainError(
        "BOOKING_STATE_CONFLICT",
        "Only confirmed bookings can receive a settlement payment.",
        409,
      );
    }

    const decision = evaluateManualSettlement({
      currentVerified: booking.verifiedPaidAmount,
      amount: input.amount,
      totalAmount: booking.totalAmount,
    });
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
        remaining_amount=${decision.remainingAmount},payment_status=${decision.paymentStatus},updated_at=now()
      where id=${booking.bookingId}::uuid
    `);
    await tx.execute(sql`
      insert into invoices(booking_id,invoice_number,status,total_amount,paid_amount,remaining_amount,issued_at)
      values (${booking.bookingId}::uuid,${`INV-${booking.bookingCode}`},'PENDING',${booking.totalAmount},
        ${decision.verifiedPaidAmount},${decision.remainingAmount},now())
      on conflict(booking_id) do nothing
    `);
    await tx.execute(sql`
      update invoices set paid_amount=${decision.verifiedPaidAmount},
        remaining_amount=${decision.remainingAmount},status='PENDING',updated_at=now()
      where booking_id=${booking.bookingId}::uuid
    `);
    await tx.execute(sql`
      insert into booking_events(booking_id,event_type,actor_type,title,description,metadata)
      values (${booking.bookingId}::uuid,'PAYMENT_VERIFIED','ADMIN','Pelunasan dicatat',${note},
        ${JSON.stringify({
          amount: input.amount,
          method: input.method,
          paymentStatus: decision.paymentStatus,
          remainingAmount: decision.remainingAmount,
          adminEmail,
          idempotencyKey: input.idempotencyKey,
        })}::jsonb)
    `);
    return {
      bookingId: booking.bookingId,
      bookingCode: booking.bookingCode,
      status: booking.status,
      ...decision,
      duplicate: false,
      invoiceNeedsRefresh: true,
    };
  });
}
