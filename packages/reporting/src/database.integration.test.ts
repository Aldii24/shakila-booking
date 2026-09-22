import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { getAdminReport } from "./query";

const configuredDatabaseUrl = process.env.DATABASE_URL;
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const safeTestDatabase = Boolean(testDatabaseUrl && testDatabaseUrl !== configuredDatabaseUrl);
if (safeTestDatabase) process.env.DATABASE_URL = testDatabaseUrl;
const integration = describe.skipIf(!safeTestDatabase);
const fixtureEmails = [
  "reporting-fixture-glamping@example.test",
  "reporting-fixture-homestay@example.test",
  "reporting-fixture-jeep@example.test",
  "reporting-fixture-boundary@example.test",
];

async function cleanup() {
  if (!safeTestDatabase) return;
  const { getDb } = await import("@booking/database");
  const database = getDb();
  const target = sql`select id from bookings where customer_email in (${sql.join(fixtureEmails.map((email) => sql`${email}`), sql`, `)})`;
  await database.execute(sql`delete from booking_events where booking_id in (${target})`);
  await database.execute(sql`delete from payment_proofs where booking_id in (${target})`);
  await database.execute(sql`delete from payment_attempts where booking_id in (${target})`);
  await database.execute(sql`delete from invoices where booking_id in (${target})`);
  await database.execute(sql`delete from accommodation_unit_reservations where booking_id in (${target})`);
  await database.execute(sql`delete from jeep_unit_reservations where booking_id in (${target})`);
  await database.execute(sql`delete from payments where booking_id in (${target})`);
  await database.execute(sql`delete from glamping_booking_details where booking_id in (${target})`);
  await database.execute(sql`delete from jeep_booking_details where booking_id in (${target})`);
  await database.execute(sql`delete from bundle_booking_details where booking_id in (${target})`);
  await database.execute(sql`delete from bookings where id in (${target})`);
}

integration("admin reports query production-shaped data from the isolated database", () => {
  let accommodationIds: { id: string; kind: "GLAMPING" | "HOMESTAY" }[];
  let jeepBusinessId: string;
  let jeepPackageId: string;
  let departureSlotId: string;
  let database: Awaited<ReturnType<typeof import("@booking/database").getDb>>;
  const bookingIds = {
    glamping: randomUUID(),
    homestay: randomUUID(),
    jeep: randomUUID(),
    boundary: randomUUID(),
  };

  beforeAll(async () => {
    await cleanup();
    const databaseModule = await import("@booking/database");
    database = databaseModule.getDb();
    accommodationIds = (await database.execute(sql`
      select distinct on (kind) id, kind
      from accommodation_types
      where is_active and kind in ('GLAMPING', 'HOMESTAY')
      order by kind, sort_order
    `)) as unknown as { id: string; kind: "GLAMPING" | "HOMESTAY" }[];
    const businesses = (await database.execute(sql`select id, slug from businesses where slug in ('glamping', 'jeep')`)) as unknown as { id: string; slug: string }[];
    const glampingBusinessId = businesses.find((row) => row.slug === "glamping")?.id;
    jeepBusinessId = businesses.find((row) => row.slug === "jeep")?.id ?? "";
    const packageRow = (await database.execute(sql`select id from jeep_packages where business_id=${jeepBusinessId}::uuid order by sort_order limit 1`)) as unknown as { id: string }[];
    jeepPackageId = packageRow[0]?.id ?? "";
    const slotRow = (await database.execute(sql`select id from jeep_departure_slots where business_id=${jeepBusinessId}::uuid order by departure_time nulls last limit 1`)) as unknown as { id: string }[];
    departureSlotId = slotRow[0]?.id ?? "";
    if (!glampingBusinessId || !jeepBusinessId || !accommodationIds[0] || !accommodationIds[1] || !jeepPackageId || !departureSlotId) {
      throw new Error("The isolated TEST_DATABASE_URL must be migrated and seeded before reporting integration tests.");
    }
    const insertBooking = (id: string, code: string, businessId: string, type: "ACCOMMODATION" | "JEEP", email: string, status: "CONFIRMED" | "CANCELLED" | "COMPLETED", paymentStatus: "PARTIALLY_PAID" | "PAID", total: number, paid: number, createdAt: string) => database.execute(sql`
      insert into bookings (id, booking_code, business_id, booking_type, booking_source, status, payment_status, customer_name, customer_email, customer_whatsapp, customer_email_normalized, customer_whatsapp_normalized, guest_count, quantity, currency, subtotal_amount, additional_amount, total_amount, dp_percentage, required_dp_amount, verified_paid_amount, remaining_amount, created_at, updated_at)
      values (${id}::uuid, ${code}, ${businessId}::uuid, ${type}, 'ONLINE', ${status}, ${paymentStatus}, ${email.split("@")[0]}, ${email}, '081299900001', ${email}, '081299900001', 2, 1, 'IDR', ${total}, 0, ${total}, 50, ${Math.ceil(total / 2)}, ${paid}, ${total - paid}, ${createdAt}::timestamptz, ${createdAt}::timestamptz)
    `);
    await insertBooking(bookingIds.glamping, "RPT-GLP-990101", glampingBusinessId, "ACCOMMODATION", fixtureEmails[0]!, "CONFIRMED", "PARTIALLY_PAID", 850000, 425000, "2098-12-31T17:30:00Z");
    await insertBooking(bookingIds.homestay, "RPT-HOM-990101", glampingBusinessId, "ACCOMMODATION", fixtureEmails[1]!, "CANCELLED", "PARTIALLY_PAID", 2000000, 1000000, "2098-12-31T18:30:00Z");
    await insertBooking(bookingIds.jeep, "RPT-JEP-990101", jeepBusinessId, "JEEP", fixtureEmails[2]!, "COMPLETED", "PAID", 750000, 750000, "2098-12-31T19:30:00Z");
    await insertBooking(bookingIds.boundary, "RPT-OLD-981231", glampingBusinessId, "ACCOMMODATION", fixtureEmails[3]!, "CONFIRMED", "PAID", 500000, 500000, "2098-12-31T16:30:00Z");
    const addAccommodation = (id: string, typeId: string, name: string) => database.execute(sql`
      insert into glamping_booking_details (booking_id, accommodation_type_id, check_in_date, check_out_date, night_count, product_name_snapshot, unit_price_snapshot, capacity_snapshot)
      values (${id}::uuid, ${typeId}::uuid, '2099-01-10', '2099-01-11', 1, ${name}, 850000, 2)
    `);
    await addAccommodation(bookingIds.glamping, accommodationIds.find((row) => row.kind === "GLAMPING")?.id ?? accommodationIds[0]!.id, "Deluxe Dome");
    await addAccommodation(bookingIds.homestay, accommodationIds.find((row) => row.kind === "HOMESTAY")?.id ?? accommodationIds[1]!.id, "Homestay Standard");
    await addAccommodation(bookingIds.boundary, accommodationIds[0]!.id, "Deluxe Dome");
    await database.execute(sql`
      insert into jeep_booking_details (booking_id, jeep_package_id, departure_slot_id, tour_date, package_name_snapshot, unit_price_snapshot, capacity_snapshot)
      values (${bookingIds.jeep}::uuid, ${jeepPackageId}::uuid, ${departureSlotId}::uuid, '2099-01-10', 'Sunrise Adventure', 750000, 6)
    `);
  });

  it("filters by booking date in Jakarta and combines Glamping + Homestay", async () => {
    const report = await getAdminReport({ business: "accommodation", period: "custom", dateFrom: "2099-01-01", dateTo: "2099-01-01" }, database);
    expect(report.rows).toHaveLength(2);
    expect(report.rows.map((row) => row.bookingCode)).toEqual(["RPT-HOM-990101", "RPT-GLP-990101"]);
    expect(report.rows.map((row) => "accommodationKindLabel" in row && row.accommodationKindLabel)).toEqual(["Homestay", "Glamping"]);
    expect(report.summary).toEqual({ totalBookings: 2, totalBookingValue: 2850000, verifiedRevenue: 425000, remainingAmount: 425000, confirmedBookings: 1, completedBookings: 0, cancelledBookings: 1 });
  });

  it("keeps Jeep separate and counts completed tours", async () => {
    const report = await getAdminReport({ business: "jeep", period: "custom", dateFrom: "2099-01-01", dateTo: "2099-01-01" }, database);
    expect(report.rows).toHaveLength(1);
    expect(report.rows[0]).toMatchObject({ bookingCode: "RPT-JEP-990101", packageName: "Sunrise Adventure", tourDate: "2099-01-10" });
    expect(report.summary.verifiedRevenue).toBe(750000);
    expect(report.summary.completedBookings).toBe(1);
  });

  it("returns a zero-summary empty report without changing data", async () => {
    const report = await getAdminReport({ business: "jeep", period: "custom", dateFrom: "2099-02-01", dateTo: "2099-02-01" }, database);
    expect(report.rows).toHaveLength(0);
    expect(report.summary).toEqual({ totalBookings: 0, totalBookingValue: 0, verifiedRevenue: 0, remainingAmount: 0, confirmedBookings: 0, completedBookings: 0, cancelledBookings: 0 });
    expect(report.emptyMessage).toBe("Tidak ada data pada periode ini.");
  });

  afterAll(async () => {
    await cleanup();
    if (database) {
      const { closeDb } = await import("@booking/database");
      await closeDb();
    }
  });
});
