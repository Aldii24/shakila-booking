import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";

const testUrl = process.env.TEST_DATABASE_URL;
if (testUrl) process.env.DATABASE_URL = testUrl;
const integration = describe.skipIf(!testUrl);
const emails = [
  "demo-gateway@example.test",
  "demo-gateway-fail@example.test",
] as const;

async function cleanup() {
  if (!testUrl) return;
  const { getDb } = await import("@booking/database");
  const db = getDb();
  const target = sql`select id from bookings where customer_email in (${emails[0]},${emails[1]})`;
  await db.execute(
    sql`delete from booking_events where booking_id in (${target})`,
  );
  await db.execute(sql`delete from invoices where booking_id in (${target})`);
  await db.execute(
    sql`delete from payment_attempts where booking_id in (${target})`,
  );
  await db.execute(
    sql`delete from accommodation_unit_reservations where booking_id in (${target})`,
  );
  await db.execute(sql`delete from payments where booking_id in (${target})`);
  await db.execute(
    sql`delete from glamping_booking_details where booking_id in (${target})`,
  );
  await db.execute(sql`delete from bookings where id in (${target})`);
}

beforeAll(() => {
  process.env.APP_MODE = "demo";
  process.env.PAYMENT_PROVIDER = "demo";
  process.env.INVOICE_STORAGE = "direct";
  process.env.EMAIL_PROVIDER = "preview";
  return cleanup();
});

integration("demo gateway", () => {
  it("records one financial effect and creates one real invoice/email preview event", async () => {
    const { createGlampingBooking } = await import("@booking/booking");
    const { getDb } = await import("@booking/database");
    const { initiateDemoPayment, completeDemoPayment } =
      await import("./index.js");
    const { prepareInvoice, getDirectInvoicePdf } =
      await import("@booking/invoice");
    const { prepareDemoEmailPreview } = await import("@booking/email");
    const db = getDb();
    const booking = await createGlampingBooking(
      {
        business: "glamping",
        reservation: {
          productSlug: "deluxe-dome",
          checkInDate: "2099-11-02",
          checkOutDate: "2099-11-03",
          quantity: 1,
          guestCount: 2,
        },
        customer: {
          fullName: "Demo Gateway",
          email: emails[0],
          whatsapp: "081299991111",
        },
      },
      randomUUID(),
      db,
    );
    const attempt = await initiateDemoPayment(
      booking.bookingCode,
      booking.bookingId,
      db,
    );
    const first = await completeDemoPayment(
      booking.bookingCode,
      booking.bookingId,
      attempt.orderId,
      db,
    );
    const duplicate = await completeDemoPayment(
      booking.bookingCode,
      booking.bookingId,
      attempt.orderId,
      db,
    );
    expect(first.bookingStatus).toBe("CONFIRMED");
    expect(duplicate.duplicate).toBe(true);
    expect((await prepareInvoice(booking.bookingId, db)).duplicate).toBe(false);
    expect((await prepareInvoice(booking.bookingId, db)).duplicate).toBe(true);
    await prepareDemoEmailPreview(booking.bookingId, db);
    await prepareDemoEmailPreview(booking.bookingId, db);
    const pdf = await getDirectInvoicePdf(booking.bookingId, db);
    expect(pdf.status).toBe("GENERATED");
    if (pdf.status === "GENERATED")
      expect(pdf.bytes.length).toBeGreaterThan(1000);
    const state = (await db.execute(
      sql`select verified_paid_amount::int paid,(select count(*)::int from payment_attempts where booking_id=b.id and status='SUCCESS') attempts,(select count(*)::int from invoices where booking_id=b.id) invoices,(select count(*)::int from booking_events where booking_id=b.id and event_type='EMAIL_SENT') emails from bookings b where id=${booking.bookingId}::uuid`,
    )) as unknown as {
      paid: number;
      attempts: number;
      invoices: number;
      emails: number;
    }[];
    expect(state[0]).toMatchObject({
      paid: attempt.amount,
      attempts: 1,
      invoices: 1,
      emails: 1,
    });
  }, 30000);

  it("keeps the hold after failure and permits an idempotent retry", async () => {
    const { createGlampingBooking } = await import("@booking/booking");
    const { getDb } = await import("@booking/database");
    const { initiateDemoPayment, failDemoPayment } = await import("./index.js");
    const db = getDb();
    const booking = await createGlampingBooking(
      {
        business: "glamping",
        reservation: {
          productSlug: "deluxe-dome",
          checkInDate: "2099-11-05",
          checkOutDate: "2099-11-06",
          quantity: 1,
          guestCount: 2,
        },
        customer: {
          fullName: "Demo Gateway Failure",
          email: emails[1],
          whatsapp: "081299991112",
        },
      },
      randomUUID(),
      db,
    );
    const attempt = await initiateDemoPayment(
      booking.bookingCode,
      booking.bookingId,
      db,
    );
    const failed = await failDemoPayment(
      booking.bookingCode,
      booking.bookingId,
      attempt.orderId,
      db,
    );
    const duplicate = await failDemoPayment(
      booking.bookingCode,
      booking.bookingId,
      attempt.orderId,
      db,
    );
    expect(failed.bookingStatus).toBe("WAITING_PAYMENT");
    expect(duplicate.duplicate).toBe(true);

    const state = (await db.execute(
      sql`select b.status as "bookingStatus",b.payment_status as "paymentStatus",r.state as "reservationState" from bookings b join accommodation_unit_reservations r on r.booking_id=b.id where b.id=${booking.bookingId}::uuid`,
    )) as unknown as {
      bookingStatus: string;
      paymentStatus: string;
      reservationState: string;
    }[];
    expect(state[0]).toMatchObject({
      bookingStatus: "WAITING_PAYMENT",
      paymentStatus: "FAILED",
      reservationState: "HELD",
    });

    const retry = await initiateDemoPayment(
      booking.bookingCode,
      booking.bookingId,
      db,
    );
    expect(retry.orderId).not.toBe(attempt.orderId);
  }, 30000);
});

afterAll(async () => {
  if (!testUrl) return;
  await cleanup();
  const { closeDb } = await import("@booking/database");
  await closeDb();
});
