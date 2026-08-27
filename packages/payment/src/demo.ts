import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { DomainError } from "@booking/booking";
import { getDb, type BookingDatabase } from "@booking/database";
import { assertDemoMode } from "@booking/validation";

const rows = <T>(value: unknown) => value as T[];

export type DemoPaymentResult = {
  bookingId: string;
  bookingCode: string;
  orderId: string;
  transactionId: string | null;
  bookingStatus: string;
  paymentStatus: string;
  duplicate: boolean;
};

export async function initiateDemoPayment(
  bookingCode: string,
  bookingId: string,
  database: BookingDatabase = getDb(),
) {
  assertDemoMode();
  return database.transaction(async (tx) => {
    const found = rows<{
      paymentId: string;
      status: string;
      expectedAmount: number;
      expiresAt: string | null;
    }>(
      await tx.execute(sql`
        select p.id as "paymentId", b.status,
          p.expected_amount::int as "expectedAmount", b.expires_at::text as "expiresAt"
        from bookings b
        join payments p on p.booking_id = b.id
        where b.id = ${bookingId}::uuid and b.booking_code = ${bookingCode}
        for update of b, p
      `),
    )[0];
    if (!found) throw new DomainError("BOOKING_NOT_FOUND", "Booking was not found.", 404);
    if (
      found.status !== "WAITING_PAYMENT" ||
      !found.expiresAt ||
      Date.parse(found.expiresAt) <= Date.now()
    ) {
      throw new DomainError("BOOKING_STATE_CONFLICT", "Booking hold is no longer active.", 409);
    }

    const active = rows<{ orderId: string }>(
      await tx.execute(sql`
        select provider_order_id as "orderId"
        from payment_attempts
        where booking_id = ${bookingId}::uuid
          and provider = 'DEMO'
          and status in ('CREATED', 'PENDING')
        order by created_at desc limit 1
      `),
    )[0];
    const orderId = active?.orderId ?? `DEMO-${bookingCode}-${randomUUID().slice(0, 8).toUpperCase()}`;
    if (!active) {
      await tx.execute(sql`
        insert into payment_attempts
          (payment_id, booking_id, provider, provider_order_id, requested_amount, status, payment_method)
        values
          (${found.paymentId}::uuid, ${bookingId}::uuid, 'DEMO', ${orderId},
           ${found.expectedAmount}, 'PENDING', 'DEMO_QRIS')
      `);
      await tx.execute(sql`update payments set status = 'PENDING', updated_at = now() where id = ${found.paymentId}::uuid`);
      await tx.execute(sql`update bookings set payment_status = 'PENDING', updated_at = now() where id = ${bookingId}::uuid`);
      await tx.execute(sql`
        insert into booking_events (booking_id, event_type, actor_type, title, metadata)
        values (${bookingId}::uuid, 'PAYMENT_CREATED', 'CUSTOMER',
          'Demo payment initiated', ${JSON.stringify({ orderId, provider: "DEMO" })}::jsonb)
      `);
    }
    return {
      provider: "DEMO" as const,
      orderId,
      amount: found.expectedAmount,
      expiresAt: found.expiresAt,
      checkoutUrl: null,
      demo: true as const,
    };
  });
}

export async function completeDemoPayment(
  bookingCode: string,
  bookingId: string,
  orderId: string,
  database: BookingDatabase = getDb(),
): Promise<DemoPaymentResult> {
  assertDemoMode();
  return database.transaction(async (tx) => {
    const attempt = rows<{
      attemptId: string;
      paymentId: string;
      requestedAmount: number;
      attemptStatus: string;
      bookingStatus: string;
      paymentStatus: string;
      expiresAt: string | null;
      requiredDp: number;
      total: number;
      verifiedPaid: number;
    }>(
      await tx.execute(sql`
        select a.id as "attemptId", a.payment_id as "paymentId",
          a.requested_amount::int as "requestedAmount", a.status as "attemptStatus",
          b.status as "bookingStatus", b.payment_status as "paymentStatus",
          b.expires_at::text as "expiresAt", b.required_dp_amount::int as "requiredDp",
          b.total_amount::int as total, b.verified_paid_amount::int as "verifiedPaid"
        from payment_attempts a
        join bookings b on b.id = a.booking_id
        where a.booking_id = ${bookingId}::uuid
          and b.booking_code = ${bookingCode}
          and a.provider = 'DEMO'
          and a.provider_order_id = ${orderId}
        for update of a, b
      `),
    )[0];
    if (!attempt) throw new DomainError("PAYMENT_ATTEMPT_NOT_FOUND", "Demo payment was not found.", 404);
    const transactionId = `DEMO-TXN-${orderId}`;
    if (attempt.attemptStatus === "SUCCESS") {
      return {
        bookingId,
        bookingCode,
        orderId,
        transactionId,
        bookingStatus: attempt.bookingStatus,
        paymentStatus: attempt.paymentStatus,
        duplicate: true,
      };
    }
    if (attempt.attemptStatus !== "PENDING") {
      throw new DomainError("PAYMENT_ATTEMPT_NOT_ACTIVE", "Demo payment attempt is no longer active.", 409);
    }
    if (
      attempt.bookingStatus !== "WAITING_PAYMENT" ||
      !attempt.expiresAt ||
      Date.parse(attempt.expiresAt) <= Date.now()
    ) {
      throw new DomainError("BOOKING_EXPIRED", "Booking hold has expired.", 409);
    }

    const newVerified = attempt.verifiedPaid + attempt.requestedAmount;
    const paymentStatus = newVerified >= attempt.total ? "PAID" : "PARTIALLY_PAID";
    if (newVerified < attempt.requiredDp) {
      throw new DomainError("PAYMENT_THRESHOLD_NOT_MET", "Verified payment is below required DP.", 409);
    }

    await tx.execute(sql`
      update payment_attempts set
        status = 'SUCCESS', provider_transaction_id = ${transactionId},
        verified_amount = ${attempt.requestedAmount}, payment_method = 'DEMO_QRIS',
        provider_paid_at = now(), verified_at = now(), updated_at = now()
      where id = ${attempt.attemptId}::uuid
    `);
    await tx.execute(sql`
      update payments set verified_amount = ${newVerified}, status = ${paymentStatus},
        verified_at = now(), updated_at = now()
      where id = ${attempt.paymentId}::uuid
    `);
    await tx.execute(sql`
      update bookings set status = 'CONFIRMED', payment_status = ${paymentStatus},
        verified_paid_amount = ${newVerified}, remaining_amount = greatest(total_amount - ${newVerified}, 0),
        confirmed_at = coalesce(confirmed_at, now()), updated_at = now()
      where id = ${bookingId}::uuid
    `);
    await tx.execute(sql`
      update accommodation_unit_reservations set state = 'CONFIRMED', updated_at = now()
      where booking_id = ${bookingId}::uuid and state = 'HELD'
    `);
    await tx.execute(sql`
      update jeep_unit_reservations set state = 'CONFIRMED', updated_at = now()
      where booking_id = ${bookingId}::uuid and state = 'HELD'
    `);
    await tx.execute(sql`
      insert into invoices
        (booking_id, invoice_number, status, total_amount, paid_amount, remaining_amount, issued_at)
      values
        (${bookingId}::uuid, ${`INV-${bookingCode}`}, 'PENDING', ${attempt.total},
         ${newVerified}, ${Math.max(attempt.total - newVerified, 0)}, now())
      on conflict (booking_id) do nothing
    `);
    await tx.execute(sql`
      insert into booking_events (booking_id, event_type, actor_type, title, metadata)
      values (${bookingId}::uuid, 'PAYMENT_VERIFIED', 'PAYMENT_PROVIDER',
        'Demo DP payment verified',
        ${JSON.stringify({ orderId, transactionId, amount: attempt.requestedAmount, provider: "DEMO" })}::jsonb)
    `);
    await tx.execute(sql`
      insert into booking_events (booking_id, event_type, actor_type, title, metadata)
      values (${bookingId}::uuid, 'BOOKING_CONFIRMED', 'SYSTEM', 'Booking confirmed',
        ${JSON.stringify({ source: "DEMO_PAYMENT" })}::jsonb)
    `);
    return {
      bookingId,
      bookingCode,
      orderId,
      transactionId,
      bookingStatus: "CONFIRMED",
      paymentStatus,
      duplicate: false,
    };
  });
}

export async function failDemoPayment(
  bookingCode: string,
  bookingId: string,
  orderId: string,
  database: BookingDatabase = getDb(),
): Promise<DemoPaymentResult> {
  assertDemoMode();
  return database.transaction(async (tx) => {
    const attempt = rows<{
      attemptId: string;
      paymentId: string;
      attemptStatus: string;
      bookingStatus: string;
      paymentStatus: string;
    }>(
      await tx.execute(sql`
        select a.id as "attemptId", a.payment_id as "paymentId", a.status as "attemptStatus",
          b.status as "bookingStatus", b.payment_status as "paymentStatus"
        from payment_attempts a join bookings b on b.id = a.booking_id
        where a.booking_id = ${bookingId}::uuid and b.booking_code = ${bookingCode}
          and a.provider = 'DEMO' and a.provider_order_id = ${orderId}
        for update of a, b
      `),
    )[0];
    if (!attempt) throw new DomainError("PAYMENT_ATTEMPT_NOT_FOUND", "Demo payment was not found.", 404);
    if (attempt.attemptStatus === "FAILED") {
      return { bookingId, bookingCode, orderId, transactionId: null, bookingStatus: attempt.bookingStatus, paymentStatus: "FAILED", duplicate: true };
    }
    if (attempt.attemptStatus !== "PENDING" || attempt.bookingStatus !== "WAITING_PAYMENT") {
      throw new DomainError("PAYMENT_ATTEMPT_NOT_ACTIVE", "Demo payment attempt is no longer active.", 409);
    }
    await tx.execute(sql`update payment_attempts set status = 'FAILED', failed_at = now(), updated_at = now() where id = ${attempt.attemptId}::uuid`);
    await tx.execute(sql`update payments set status = 'FAILED', updated_at = now() where id = ${attempt.paymentId}::uuid`);
    await tx.execute(sql`update bookings set payment_status = 'FAILED', updated_at = now() where id = ${bookingId}::uuid`);
    await tx.execute(sql`
      insert into booking_events (booking_id, event_type, actor_type, title, metadata)
      values (${bookingId}::uuid, 'PAYMENT_FAILED', 'PAYMENT_PROVIDER', 'Demo payment failed',
        ${JSON.stringify({ orderId, provider: "DEMO" })}::jsonb)
    `);
    return { bookingId, bookingCode, orderId, transactionId: null, bookingStatus: "WAITING_PAYMENT", paymentStatus: "FAILED", duplicate: false };
  });
}
