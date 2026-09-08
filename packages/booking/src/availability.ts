import { and, eq, sql } from "drizzle-orm";
import {
  accommodationTypes, businesses, getDb, jeepDepartureSlots, jeepPackages, type BookingDatabase,
} from "@booking/database";
import { assertNotPast, calculateNightCount } from "./core";
import { DomainError } from "./errors";

export async function calculateAccommodationAvailability(input: {
  accommodationTypeId: string; checkInDate: string; checkOutDate: string;
}, database: BookingDatabase = getDb()): Promise<number> {
  calculateNightCount(input.checkInDate, input.checkOutDate);
  const rows = await database.execute(sql<{ available_quantity: number }>`
    select count(*)::int as available_quantity
    from accommodation_units au
    where au.accommodation_type_id = ${input.accommodationTypeId}::uuid
      and au.is_active = true
      and not exists (
        select 1 from accommodation_unit_reservations r
        where r.accommodation_unit_id = au.id
          and r.state in ('HELD', 'CONFIRMED', 'IN_USE')
          and r.check_in_date < ${input.checkOutDate}::date
          and r.check_out_date > ${input.checkInDate}::date
      )
      and not exists (
        select 1 from inventory_blocks b
        where b.accommodation_unit_id = au.id and b.removed_at is null
          and b.start_date < ${input.checkOutDate}::date
          and b.end_date > ${input.checkInDate}::date
      )
  `);
  return Number(rows[0]?.available_quantity ?? 0);
}

export async function calculateJeepAvailability(input: {
  businessId: string; tourDate: string; departureSlotId: string;
}, database: BookingDatabase = getDb()): Promise<number> {
  const rows = await database.execute(sql<{ available_quantity: number }>`
    select count(*)::int as available_quantity
    from jeep_units ju
    where ju.business_id = ${input.businessId}::uuid and ju.is_active = true
      and not exists (
        select 1 from jeep_unit_reservations r
        join jeep_departure_slots reserved_slot on reserved_slot.id = r.departure_slot_id
        join jeep_departure_slots requested_slot on requested_slot.id = ${input.departureSlotId}::uuid
        where r.jeep_unit_id = ju.id and r.tour_date = ${input.tourDate}::date
          and reserved_slot.departure_time = requested_slot.departure_time
          and r.state in ('HELD', 'CONFIRMED', 'IN_USE')
      )
      and not exists (
        select 1 from inventory_blocks b
        left join jeep_departure_slots blocked_slot on blocked_slot.id = b.departure_slot_id
        join jeep_departure_slots requested_slot on requested_slot.id = ${input.departureSlotId}::uuid
        where b.jeep_unit_id = ju.id and b.removed_at is null
          and b.start_date = ${input.tourDate}::date
          and (b.departure_slot_id is null or blocked_slot.departure_time = requested_slot.departure_time)
      )
  `);
  return Number(rows[0]?.available_quantity ?? 0);
}

export async function calculateBundleAvailability(input: {
  bundleSlug: string; checkInDate: string; checkOutDate: string;
}, database: BookingDatabase = getDb()): Promise<number> {
  assertNotPast(input.checkInDate, "Asia/Jakarta");
  calculateNightCount(input.checkInDate, input.checkOutDate);
  const product = await getBundleProduct(input.bundleSlug, database);
  const [roomRows, jeepRows] = await Promise.all([
    database.execute(sql<{ available_quantity: number }>`
      select count(*)::int as available_quantity from accommodation_units au
      where au.accommodation_type_id=${product.bundle.accommodationTypeId}::uuid and au.is_active
      and not exists (select 1 from accommodation_unit_reservations r where r.accommodation_unit_id=au.id and r.state in ('HELD','CONFIRMED','IN_USE') and r.check_in_date < ${input.checkOutDate}::date and r.check_out_date > ${input.checkInDate}::date)
      and not exists (select 1 from inventory_blocks b where b.accommodation_unit_id=au.id and b.removed_at is null and b.start_date < ${input.checkOutDate}::date and b.end_date > ${input.checkInDate}::date)
    `),
    database.execute(sql<{ available_quantity: number }>`
      select count(*)::int as available_quantity from jeep_units ju
      where ju.business_id=${product.jeepBusinessId}::uuid and ju.is_active
      and not exists (select 1 from jeep_unit_reservations r where r.jeep_unit_id=ju.id and r.tour_date=${input.checkInDate}::date and r.state in ('HELD','CONFIRMED','IN_USE'))
      and not exists (select 1 from inventory_blocks b where b.jeep_unit_id=ju.id and b.removed_at is null and b.start_date=${input.checkInDate}::date)
    `),
  ]);
  const rooms = Number(roomRows[0]?.available_quantity ?? 0);
  const jeeps = Number(jeepRows[0]?.available_quantity ?? 0);
  return Math.min(
    Math.floor(rooms / product.bundle.accommodationQuantity),
    Math.floor(jeeps / product.bundle.jeepQuantity),
  );
}

export async function getAccommodationProduct(slug: string, database: BookingDatabase = getDb()) {
  const [row] = await database.select({ product: accommodationTypes }).from(accommodationTypes)
    .innerJoin(businesses, eq(businesses.id, accommodationTypes.businessId))
    .where(and(eq(businesses.slug, "glamping"), eq(businesses.isActive, true), eq(accommodationTypes.slug, slug), eq(accommodationTypes.isActive, true))).limit(1);
  const product = row?.product;
  if (!product) throw new DomainError("PRODUCT_NOT_FOUND", "Accommodation type was not found.", 404);
  return product;
}

export async function getJeepProduct(packageSlug: string, departureSlotId: string, database: BookingDatabase = getDb()) {
  const [row] = await database.select({ package: jeepPackages, slot: jeepDepartureSlots })
    .from(jeepPackages).innerJoin(businesses, eq(businesses.id, jeepPackages.businessId)).innerJoin(jeepDepartureSlots, eq(jeepDepartureSlots.jeepPackageId, jeepPackages.id))
    .where(and(eq(businesses.slug, "jeep"), eq(businesses.isActive, true), eq(jeepPackages.slug, packageSlug), eq(jeepPackages.isActive, true), eq(jeepDepartureSlots.id, departureSlotId), eq(jeepDepartureSlots.isActive, true))).limit(1);
  if (!row) throw new DomainError("INVALID_DEPARTURE_SLOT", "Jeep package or departure slot was not found.", 404);
  return row;
}

export async function getBundleProduct(slug: string, database: BookingDatabase = getDb()) {
  const result = await database.execute(sql<{
    id: string; business_id: string; slug: string; name: string; description: string;
    accommodation_type_id: string; jeep_package_id: string; accommodation_quantity: number;
    jeep_quantity: number; night_count: number; price_per_package: number; capacity_per_package: number;
    routes: string[]; inclusions: string[]; conditions: string[]; weekend_surcharge: number;
    accommodation_name: string; accommodation_base_price: number; jeep_package_name: string; jeep_business_id: string;
  }>`
    select bp.*, a.name accommodation_name, a.base_price accommodation_base_price, jp.name jeep_package_name, jp.business_id jeep_business_id
    from bundle_packages bp
    join businesses b on b.id=bp.business_id and b.slug='glamping' and b.is_active
    join accommodation_types a on a.id=bp.accommodation_type_id and a.is_active
    join jeep_packages jp on jp.id=bp.jeep_package_id and jp.is_active
    where bp.slug=${slug} and bp.is_active limit 1
  `) as unknown as {
    id: string; business_id: string; slug: string; name: string; description: string;
    accommodation_type_id: string; jeep_package_id: string; accommodation_quantity: number;
    jeep_quantity: number; night_count: number; price_per_package: number; capacity_per_package: number;
    routes: string[]; inclusions: string[]; conditions: string[]; weekend_surcharge: number;
    accommodation_name: string; accommodation_base_price: number; jeep_package_name: string; jeep_business_id: string;
  }[];
  const row = result[0];
  if (!row) throw new DomainError("PRODUCT_NOT_FOUND", "Bundle package was not found.", 404);
  return {
    bundle: {
      id: row.id, businessId: row.business_id, slug: row.slug, name: row.name, description: row.description,
      accommodationTypeId: row.accommodation_type_id, jeepPackageId: row.jeep_package_id,
      accommodationQuantity: row.accommodation_quantity, jeepQuantity: row.jeep_quantity,
      nightCount: row.night_count, pricePerPackage: Number(row.price_per_package),
      additionalNightPrice: Number(row.accommodation_base_price),
      capacityPerPackage: row.capacity_per_package, routes: row.routes, inclusions: row.inclusions,
      conditions: row.conditions, weekendSurcharge: Number(row.weekend_surcharge),
    },
    accommodationName: row.accommodation_name,
    jeepPackageName: row.jeep_package_name,
    jeepBusinessId: row.jeep_business_id,
  };
}

export function nextDate(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function assertCapacity(guestCount: number, quantity: number, capacityPerUnit: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) throw new DomainError("INVALID_QUANTITY", "Quantity must be a positive integer.");
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > quantity * capacityPerUnit) {
    throw new DomainError("INVALID_GUEST_COUNT", "Guest count exceeds the selected inventory capacity.");
  }
}

export function assertPositiveGuestCount(guestCount: number): void {
  if (!Number.isInteger(guestCount) || guestCount < 1) {
    throw new DomainError("INVALID_GUEST_COUNT", "Guest count must be a positive integer.");
  }
}

export function assertReservationDate(date: string, timezone: string): void {
  assertNotPast(date, timezone);
}
