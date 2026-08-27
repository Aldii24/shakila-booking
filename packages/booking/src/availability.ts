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
        where r.jeep_unit_id = ju.id and r.tour_date = ${input.tourDate}::date
          and r.departure_slot_id = ${input.departureSlotId}::uuid
          and r.state in ('HELD', 'CONFIRMED', 'IN_USE')
      )
      and not exists (
        select 1 from inventory_blocks b
        where b.jeep_unit_id = ju.id and b.removed_at is null
          and b.start_date = ${input.tourDate}::date
          and (b.departure_slot_id is null or b.departure_slot_id = ${input.departureSlotId}::uuid)
      )
  `);
  return Number(rows[0]?.available_quantity ?? 0);
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

export function assertCapacity(guestCount: number, quantity: number, capacityPerUnit: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) throw new DomainError("INVALID_QUANTITY", "Quantity must be a positive integer.");
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > quantity * capacityPerUnit) {
    throw new DomainError("INVALID_GUEST_COUNT", "Guest count exceeds the selected inventory capacity.");
  }
}

export function assertReservationDate(date: string, timezone: string): void {
  assertNotPast(date, timezone);
}
