import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";

const testUrl = process.env.TEST_DATABASE_URL;
if (testUrl) process.env.DATABASE_URL = testUrl;
const integration = describe.skipIf(!testUrl);
const emails = [
  "admin-lifecycle@example.test",
  "admin-snapshot@example.test",
  "admin-early-checkout@example.test",
] as const;

async function cleanup() {
  if (!testUrl) return;
  const { getDb } = await import("@booking/database");
  const db = getDb();
  const target = sql`select id from bookings where customer_email in (${emails[0]},${emails[1]},${emails[2]})`;
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
  await db.execute(
    sql`delete from jeep_unit_reservations where booking_id in (${target})`,
  );
  await db.execute(sql`delete from payments where booking_id in (${target})`);
  await db.execute(
    sql`delete from glamping_booking_details where booking_id in (${target})`,
  );
  await db.execute(
    sql`delete from jeep_booking_details where booking_id in (${target})`,
  );
  await db.execute(sql`delete from bookings where id in (${target})`);
  await db.execute(sql`delete from accommodation_units where accommodation_type_id in (select id from accommodation_types where name like 'Revision Test %')`);
  await db.execute(sql`delete from accommodation_types where name like 'Revision Test %'`);
  await db.execute(sql`delete from jeep_departure_slots where jeep_package_id in (select id from jeep_packages where name like 'Revision Test %')`);
  await db.execute(sql`delete from jeep_departure_slots where name='Admin Lifecycle Test'`);
  await db.execute(sql`delete from jeep_packages where name like 'Revision Test %'`);
  await db.execute(sql`delete from jeep_units where code like 'TEST-JEEP-%'`);
}

const jakartaDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const tomorrowInJakarta = () => {
  const value = new Date(`${jakartaDate()}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
};

beforeAll(cleanup);

integration("admin operations against PostgreSQL", () => {
  it("returns real dashboard aggregates and filtered, paginated bookings", async () => {
    const { getAdminOverview, listAdminBookings } = await import("./admin.js");
    const overview = await getAdminOverview();
    const filtered = await listAdminBookings({
      business: "glamping",
      paymentStatus: "PAID",
      page: 1,
      pageSize: 2,
    });
    expect(
      Number((overview as Record<string, unknown>).totalBookings),
    ).toBeGreaterThan(0);
    expect(overview.breakdown).toHaveLength(2);
    expect(filtered.items.length).toBeLessThanOrEqual(2);
    expect(filtered.items.every((row) => row.business === "glamping")).toBe(
      true,
    );
    expect(filtered.items.every((row) => row.paymentStatus === "PAID")).toBe(
      true,
    );
  });

  it("persists Jeep check-in and check-out with admin timeline actors", async () => {
    const { createJeepBooking } = await import("./creation.js");
    const { adminBookingCommand, getAdminBooking } = await import("./admin.js");
    const { getDb } = await import("@booking/database");
    const db = getDb();
    const slot = (await db.execute(
      sql`insert into jeep_departure_slots(business_id,jeep_package_id,name,departure_time)
          select p.business_id,p.id,'Admin Lifecycle Test','23:59'::time
          from jeep_packages p where p.slug='short-1'
          returning id`,
    )) as unknown as { id: string }[];
    const slotId = slot[0]?.id;
    if (!slotId) throw new Error("Seeded Jeep departure slot was not found.");
    const booking = await createJeepBooking(
      {
        business: "jeep",
        reservation: {
          packageSlug: "short-1",
          tourDate: jakartaDate(),
          departureSlotId: slotId,
          quantity: 1,
          guestCount: 1,
        },
        customer: {
          fullName: "Admin Lifecycle",
          email: emails[0],
          whatsapp: "081299992221",
        },
      },
      randomUUID(),
      db,
    );
    await db.execute(
      sql`update bookings set status='CONFIRMED',payment_status='PARTIALLY_PAID',verified_paid_amount=required_dp_amount,remaining_amount=total_amount-required_dp_amount where id=${booking.bookingId}::uuid`,
    );
    await db.execute(
      sql`update payments set status='PARTIALLY_PAID',verified_amount=expected_amount where booking_id=${booking.bookingId}::uuid`,
    );
    await db.execute(
      sql`update jeep_unit_reservations set state='CONFIRMED' where booking_id=${booking.bookingId}::uuid`,
    );

    const checkInInstant = new Date(`${jakartaDate()}T06:00:00.000Z`);
    await expect(
      adminBookingCommand(booking.bookingCode, "check-in", {}, db, checkInInstant),
    ).rejects.toMatchObject({ code: "PAYMENT_BALANCE_REMAINING" });
    await db.execute(
      sql`update bookings set payment_status='PAID',verified_paid_amount=total_amount,remaining_amount=0 where id=${booking.bookingId}::uuid`,
    );
    await db.execute(
      sql`update payments set status='PAID',verified_amount=(select total_amount from bookings where id=${booking.bookingId}::uuid) where booking_id=${booking.bookingId}::uuid`,
    );

    expect(
      (await adminBookingCommand(booking.bookingCode, "check-in", {}, db, checkInInstant)).status,
    ).toBe("CHECKED_IN");
    expect(
      (await adminBookingCommand(booking.bookingCode, "check-out")).status,
    ).toBe("CHECKED_OUT");
    const detail = await getAdminBooking(booking.bookingCode);
    expect((detail as Record<string, unknown>).status).toBe("CHECKED_OUT");
    expect(
      (detail.events as Record<string, unknown>[])
        .filter((event) =>
          ["CHECKED_IN", "CHECKED_OUT"].includes(String(event.eventType)),
        )
        .every((event) => event.actorType === "ADMIN"),
    ).toBe(true);
  });

  it("requires explicit confirmation for an early Glamping checkout", async () => {
    const { createGlampingBooking } = await import("./creation.js");
    const { adminBookingCommand } = await import("./admin.js");
    const { getDb } = await import("@booking/database");
    const db = getDb();
    const booking = await createGlampingBooking(
      {
        business: "glamping",
        reservation: {
          productSlug: "glamping-deluxe",
          checkInDate: jakartaDate(),
          checkOutDate: tomorrowInJakarta(),
          quantity: 1,
          guestCount: 2,
        },
        customer: {
          fullName: "Early Checkout Test",
          email: emails[2],
          whatsapp: "081299992223",
        },
      },
      randomUUID(),
      db,
    );
    await db.execute(sql`update bookings set status='CONFIRMED',payment_status='PARTIALLY_PAID',verified_paid_amount=required_dp_amount,remaining_amount=total_amount-required_dp_amount where id=${booking.bookingId}::uuid`);
    await db.execute(sql`update accommodation_unit_reservations set state='CONFIRMED' where booking_id=${booking.bookingId}::uuid`);
    await db.execute(sql`update bookings set status='CHECKED_IN',checked_in_at=now() where id=${booking.bookingId}::uuid`);
    await db.execute(sql`update accommodation_unit_reservations set state='IN_USE' where booking_id=${booking.bookingId}::uuid`);
    await expect(adminBookingCommand(booking.bookingCode, "check-out")).rejects.toMatchObject({ code: "CHECK_OUT_NOT_ALLOWED" });
    await expect(adminBookingCommand(booking.bookingCode, "check-out", { confirmEarlyCheckout: true })).resolves.toMatchObject({ status: "CHECKED_OUT" });
  });

  it("rejects a block conflict and preserves historical price snapshots", async () => {
    const { createGlampingBooking } = await import("./creation.js");
    const { createInventoryBlock, getAdminBooking, updateAdminAccommodationUnit, updateAdminProduct } =
      await import("./admin.js");
    const { getDb } = await import("@booking/database");
    const db = getDb();
    const booking = await createGlampingBooking(
      {
        business: "glamping",
        reservation: {
          productSlug: "glamping-deluxe",
          checkInDate: "2099-12-02",
          checkOutDate: "2099-12-03",
          quantity: 1,
          guestCount: 2,
        },
        customer: {
          fullName: "Admin Snapshot",
          email: emails[1],
          whatsapp: "081299992222",
        },
      },
      randomUUID(),
      db,
    );
    const allocation = (await db.execute(
      sql`select accommodation_unit_id as id from accommodation_unit_reservations where booking_id=${booking.bookingId}::uuid`,
    )) as unknown as { id: string }[];
    const unitId = allocation[0]?.id;
    if (!unitId)
      throw new Error("Physical accommodation allocation was not found.");
    await expect(
      createInventoryBlock({
        resourceType: "ACCOMMODATION_UNIT",
        unitId,
        startDate: "2099-12-02",
        endDate: "2099-12-03",
        reason: "Test conflict",
      }),
    ).rejects.toMatchObject({ code: "INVENTORY_NOT_AVAILABLE" });
    await expect(
      updateAdminAccommodationUnit(unitId, { isActive: false }),
    ).rejects.toMatchObject({ code: "INVENTORY_IN_USE" });

    const product = (await db.execute(
      sql`select id,base_price::int as price from accommodation_types where slug='glamping-deluxe'`,
    )) as unknown as { id: string; price: number }[];
    const currentProduct = product[0];
    if (!currentProduct)
      throw new Error("Seeded accommodation type was not found.");
    const before = await getAdminBooking(booking.bookingCode);
    try {
      await updateAdminProduct("glamping", currentProduct.id, {
        price: currentProduct.price + 1000,
      });
      const after = await getAdminBooking(booking.bookingCode);
      expect((after as Record<string, unknown>).totalAmount).toBe(
        (before as Record<string, unknown>).totalAmount,
      );
      expect((after as Record<string, unknown>).productName).toBe(
        (before as Record<string, unknown>).productName,
      );
    } finally {
      await updateAdminProduct("glamping", currentProduct.id, {
        price: currentProduct.price,
      });
    }
  });

  it("creates and edits Glamping types and physical units that change public availability", async () => {
    const {
      createAdminAccommodationUnit,
      createAdminProduct,
      getPublicGlampingCalendar,
      updateAdminProduct,
    } = await import("./index.js");
    const created = await createAdminProduct("glamping", {
      name: "Revision Test Panorama Cabin",
      description: "Integration-only accommodation type.",
      price: 990000,
      capacity: 3,
    });
    const before = await getPublicGlampingCalendar({
      startDate: "2099-12-10",
      endDate: "2099-12-10",
    });
    const beforeRow = before.days[0]?.inventory.find(
      (row) => row.productSlug === created.slug,
    );
    expect(beforeRow?.availableUnits).toBe(0);
    await createAdminAccommodationUnit(String(created.id), {
      code: "test-cabin-01",
      name: "Test Cabin 01",
    });
    const after = await getPublicGlampingCalendar({
      startDate: "2099-12-10",
      endDate: "2099-12-10",
    });
    expect(
      after.days[0]?.inventory.find((row) => row.productSlug === created.slug)
        ?.availableUnits,
    ).toBe(1);
    await updateAdminProduct("glamping", String(created.id), {
      name: "Revision Test Panorama Cabin Updated",
      price: 1090000,
      capacity: 4,
    });
    const { getDb } = await import("@booking/database");
    const updated = (await getDb().execute(
      sql`select name,base_price::int price,capacity_per_unit capacity from accommodation_types where id=${String(created.id)}::uuid`,
    )) as unknown as { name: string; price: number; capacity: number }[];
    expect(updated[0]).toMatchObject({
      name: "Revision Test Panorama Cabin Updated",
      price: 1090000,
      capacity: 4,
    });
  });

  it("creates Jeep packages, slots, and a physical Jeep that increases availability", async () => {
    const {
      calculateJeepAvailability,
      createAdminDepartureSlot,
      createAdminJeepUnit,
      createAdminProduct,
    } = await import("./index.js");
    const { getDb } = await import("@booking/database");
    const db = getDb();
    const seeded = (await db.execute(
      sql`select s.id,b.id as "businessId" from jeep_departure_slots s join businesses b on b.id=s.business_id where b.slug='jeep' and s.is_active order by s.departure_time limit 1`,
    )) as unknown as { id: string; businessId: string }[];
    const base = seeded[0];
    if (!base) throw new Error("Seeded Jeep slot was not found.");
    const input = {
      businessId: base.businessId,
      tourDate: "2099-12-11",
      departureSlotId: base.id,
    };
    const before = await calculateJeepAvailability(input, db);
    await createAdminJeepUnit({
      code: "test-jeep-99",
      name: "Test Jeep 99",
    });
    expect(await calculateJeepAvailability(input, db)).toBe(before + 1);
    const product = await createAdminProduct("jeep", {
      name: "Revision Test Crater Run",
      description: "Integration-only Jeep package.",
      price: 880000,
      capacity: 6,
    });
    const slot = await createAdminDepartureSlot(String(product.id), {
      name: "Revision Morning",
      departureTime: "09:30",
    });
    expect(slot).toMatchObject({ name: "Revision Morning", isActive: true });
  });

  it("searches, filters, and paginates payment attempts on the server", async () => {
    const { listAdminPayments } = await import("./admin.js");
    const firstPage = await listAdminPayments({ page: 1, pageSize: 2 });
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.total).toBeGreaterThan(2);
    expect(firstPage.totalPages).toBeGreaterThan(1);
    const first = firstPage.items[0];
    const byBooking = await listAdminPayments({
      search: String(first?.bookingCode),
      pageSize: 20,
    });
    expect(byBooking.items.length).toBeGreaterThan(0);
    expect(
      byBooking.items.every((row) => row.bookingCode === first?.bookingCode),
    ).toBe(true);
    const filtered = await listAdminPayments({
      status: String(first?.status),
      method: first?.paymentMethod ? String(first.paymentMethod) : null,
      pageSize: 20,
    });
    expect(filtered.items.every((row) => row.status === first?.status)).toBe(true);
  });
});

afterAll(async () => {
  if (!testUrl) return;
  await cleanup();
  const { closeDb } = await import("@booking/database");
  await closeDb();
});
