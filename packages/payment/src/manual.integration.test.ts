import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";

const testUrl = process.env.TEST_DATABASE_URL;
if (testUrl) process.env.DATABASE_URL = testUrl;
const integration = describe.skipIf(!testUrl);
const email = "manual-proof-flow@example.test";
const cancelledEmail = "manual-proof-cancelled@example.test";

async function cleanup() {
  if (!testUrl) return;
  const { getDb } = await import("@booking/database");
  const db = getDb();
  const target = sql`select b.id from bookings b
    left join glamping_booking_details g on g.booking_id=b.id
    where (b.customer_email=${email} or b.customer_email=${cancelledEmail})
      or b.admin_notes='manual-overbook-test'
      or (b.customer_email like 'manual-%@shakila.invalid' and g.check_in_date='2099-10-10'::date)`;
  await db.execute(sql`delete from payment_proofs where booking_id in (${target})`);
  await db.execute(sql`delete from booking_events where booking_id in (${target})`);
  await db.execute(sql`delete from invoices where booking_id in (${target})`);
  await db.execute(sql`delete from payment_attempts where booking_id in (${target})`);
  await db.execute(sql`delete from accommodation_unit_reservations where booking_id in (${target})`);
  await db.execute(sql`delete from jeep_unit_reservations where booking_id in (${target})`);
  await db.execute(sql`delete from payments where booking_id in (${target})`);
  await db.execute(sql`delete from glamping_booking_details where booking_id in (${target})`);
  await db.execute(sql`delete from jeep_booking_details where booking_id in (${target})`);
  await db.execute(sql`delete from bookings where id in (${target})`);
}

beforeAll(cleanup);

integration("manual transfer and Admin booking revision", () => {
  it("upload does not confirm, rejection permits retry, approval confirms, and duplicate approval is idempotent", async () => {
    const { createGlampingBooking } = await import("@booking/booking");
    const { getDb } = await import("@booking/database");
    const { approveManualPaymentProof, rejectManualPaymentProof, submitManualPaymentProof } = await import("./manual.js");
    const { recordManualSettlement } = await import("./settlement.js");
    const db = getDb();
    const booking = await createGlampingBooking({ business: "glamping", reservation: { productSlug: "glamping-deluxe", checkInDate: "2099-10-02", checkOutDate: "2099-10-03", quantity: 1, guestCount: 2 }, customer: { fullName: "Manual Proof Flow", email, whatsapp: "081288881111" } }, randomUUID(), db);
    const base64 = Buffer.from("89504e470d0a1a0a", "hex").toString("base64");
    const first = await submitManualPaymentProof(booking.bookingCode, booking.bookingId, { claimedAmount: booking.requiredDpAmount, fileName: "proof.png", mimeType: "image/png", fileSize: 8, fileDataBase64: base64 }, db);
    let state = (await db.execute(sql`select status,payment_status as "paymentStatus" from bookings where id=${booking.bookingId}::uuid`)) as unknown as { status: string; paymentStatus: string }[];
    expect(state[0]).toMatchObject({ status: "WAITING_PAYMENT", paymentStatus: "PENDING" });
    await rejectManualPaymentProof(first.id, "Nominal pada bukti tidak terbaca", "admin@shakila.test", db);
    state = (await db.execute(sql`select status,payment_status as "paymentStatus" from bookings where id=${booking.bookingId}::uuid`)) as unknown as { status: string; paymentStatus: string }[];
    expect(state[0]).toMatchObject({ status: "WAITING_PAYMENT", paymentStatus: "UNPAID" });
    const jpeg = Buffer.from("ffd8ff", "hex").toString("base64");
    const retry = await submitManualPaymentProof(booking.bookingCode, booking.bookingId, { claimedAmount: booking.requiredDpAmount, fileName: "retry.jpg", mimeType: "image/jpeg", fileSize: 3, fileDataBase64: jpeg }, db);
    const approved = await approveManualPaymentProof(retry.id, booking.requiredDpAmount, "admin@shakila.test", db);
    const duplicate = await approveManualPaymentProof(retry.id, booking.requiredDpAmount, "admin@shakila.test", db);
    expect(approved).toMatchObject({ status: "CONFIRMED", paymentStatus: "PARTIALLY_PAID", duplicate: false });
    expect(duplicate.duplicate).toBe(true);
    const effects = (await db.execute(sql`select verified_paid_amount::int as paid,(select count(*)::int from booking_events where booking_id=b.id and event_type='PAYMENT_PROOF_APPROVED') approvals from bookings b where id=${booking.bookingId}::uuid`)) as unknown as { paid: number; approvals: number }[];
    expect(effects[0]).toMatchObject({ paid: booking.requiredDpAmount, approvals: 1 });
    const settlementKey = randomUUID();
    const remaining = booking.totalAmount - booking.requiredDpAmount;
    const settlement = await recordManualSettlement(booking.bookingCode, { amount: remaining, method: "TRANSFER", note: "Pelunasan sebelum check-in", idempotencyKey: settlementKey }, "admin@shakila.test", db);
    const duplicateSettlement = await recordManualSettlement(booking.bookingCode, { amount: remaining, method: "TRANSFER", note: "Pelunasan sebelum check-in", idempotencyKey: settlementKey }, "admin@shakila.test", db);
    expect(settlement).toMatchObject({ paymentStatus: "PAID", verifiedPaidAmount: booking.totalAmount, remainingAmount: 0, duplicate: false });
    expect(duplicateSettlement).toMatchObject({ paymentStatus: "PAID", remainingAmount: 0, duplicate: true });
    const paidState = (await db.execute(sql`select b.payment_status as "paymentStatus",b.remaining_amount::int as remaining,i.paid_amount::int as "invoicePaid",i.remaining_amount::int as "invoiceRemaining",(select count(*)::int from payment_attempts where booking_id=b.id and provider='MANUAL_ADMIN') as settlements,(select count(*)::int from booking_events where booking_id=b.id and title='Pelunasan dicatat') as events from bookings b join invoices i on i.booking_id=b.id where b.id=${booking.bookingId}::uuid`)) as unknown as { paymentStatus: string; remaining: number; invoicePaid: number; invoiceRemaining: number; settlements: number; events: number }[];
    expect(paidState[0]).toMatchObject({ paymentStatus: "PAID", remaining: 0, invoicePaid: booking.totalAmount, invoiceRemaining: 0, settlements: 1, events: 1 });
  });

  it("manual Admin booking uses the shared allocator and cannot overbook", async () => {
    const { createAdminManualBooking } = await import("@booking/booking");
    const { getDb } = await import("@booking/database");
    const db = getDb();
    const inventory = (await db.execute(sql`
      select count(*)::int as count
      from accommodation_units u
      join accommodation_types t on t.id=u.accommodation_type_id
      where t.slug='glamping-deluxe' and u.is_active=true and t.is_active=true
    `)) as unknown as { count: number }[];
    const quantity = inventory[0]?.count ?? 0;
    expect(quantity).toBeGreaterThan(0);
    const make = (suffix: string) => createAdminManualBooking({ source: "WALK_IN", business: "glamping", reservation: { productSlug: "glamping-deluxe", checkInDate: "2099-10-10", checkOutDate: "2099-10-11", quantity, guestCount: 2 }, customer: { fullName: `Walk In ${suffix}`, whatsapp: `08128888222${suffix}` }, notes: "manual-overbook-test", paymentState: "UNPAID", amountReceived: 0 }, "admin@shakila.test", db);
    const results = await Promise.allSettled([make("1"), make("2")]);
    const failures = results.filter((result) => result.status === "rejected").map((result) => {
      const reason = result.reason as { message?: string; cause?: { message?: string; cause?: { message?: string } } };
      return [reason.message, reason.cause?.message, reason.cause?.cause?.message].filter(Boolean).join(" -> ");
    });
    expect(results.filter((result) => result.status === "fulfilled"), failures.join(" | ")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });

  it("closes a pending proof when its booking is cancelled", async () => {
    const { cancelBooking, createGlampingBooking } = await import("@booking/booking");
    const { getDb } = await import("@booking/database");
    const { submitManualPaymentProof } = await import("./manual.js");
    const db = getDb();
    const booking = await createGlampingBooking({ business: "glamping", reservation: { productSlug: "glamping-deluxe", checkInDate: "2099-10-04", checkOutDate: "2099-10-05", quantity: 1, guestCount: 2 }, customer: { fullName: "Cancelled Manual Proof", email: cancelledEmail, whatsapp: "081288881112" } }, randomUUID(), db);
    const proof = await submitManualPaymentProof(booking.bookingCode, booking.bookingId, { claimedAmount: booking.requiredDpAmount, fileName: "cancelled.png", mimeType: "image/png", fileSize: 8, fileDataBase64: Buffer.from("89504e470d0a1a0a", "hex").toString("base64") }, db);
    await cancelBooking(booking.bookingId, db);
    const state = (await db.execute(sql`select b.payment_status as "paymentStatus",pr.status as "proofStatus",a.status as "attemptStatus" from bookings b join payment_proofs pr on pr.booking_id=b.id join payment_attempts a on a.id=pr.payment_attempt_id where pr.id=${proof.id}::uuid`)) as unknown as { paymentStatus: string; proofStatus: string; attemptStatus: string }[];
    expect(state[0]).toMatchObject({ paymentStatus: "UNPAID", proofStatus: "REJECTED", attemptStatus: "CANCELLED" });
  });
});

afterAll(async () => { if (!testUrl) return; await cleanup(); const { closeDb } = await import("@booking/database"); await closeDb(); });
