import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import type { CreateBookingRequest, QuoteRequest } from "@booking/contracts";
import { getDb, type BookingDatabase } from "@booking/database";
import { normalizeEmail, normalizeWhatsApp } from "@booking/validation";
import { assertCapacity, assertReservationDate, getAccommodationProduct, getJeepProduct } from "./availability";
import { assertJeepDepartureOpen, businessDate, calculateDp, calculateGlampingPrice, calculateJeepPrice } from "./core";
import { DomainError, isIdempotencyConstraintError, isInventoryConstraintError } from "./errors";

type Tx = Parameters<Parameters<BookingDatabase["transaction"]>[0]>[0];
type BookingResult = { bookingId: string; bookingCode: string; status: string; paymentStatus: string; totalAmount: number; requiredDpAmount: number; expiresAt: Date | null };

const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

async function settings(slug: string, database: BookingDatabase) {
  const rows = await database.execute(sql<{ id: string; code: string; timezone: string; dp_percentage: number; booking_hold_minutes: number }>`
    select b.id, b.code, b.timezone, s.dp_percentage, s.booking_hold_minutes
    from businesses b join business_settings s on s.business_id = b.id
    where b.slug = ${slug} and b.is_active = true limit 1
  `) as unknown as { id: string; code: string; timezone: string; dp_percentage: number; booking_hold_minutes: number }[];
  if (!rows[0]) throw new DomainError("BUSINESS_NOT_FOUND", "Business was not found.", 404);
  return rows[0];
}

async function bookingCode(tx: Tx, code: string, timezone: string) {
  const day = businessDate(timezone).replaceAll("-", "").slice(2);
  const rows = await tx.execute(sql<{ sequence: string }>`select lpad(nextval('booking_number_seq')::text, 6, '0') as sequence`) as unknown as {sequence:string}[];
  return `${code}-${day}-${rows[0]!.sequence}`;
}

async function existing(tx: Tx, key: string, expectedFingerprint: string): Promise<BookingResult | undefined> {
  const rows = await tx.execute(sql<BookingResult & { idempotency_fingerprint: string }>`
    select id as "bookingId", booking_code as "bookingCode", status, payment_status as "paymentStatus",
      total_amount::int as "totalAmount", required_dp_amount::int as "requiredDpAmount", expires_at as "expiresAt",
      idempotency_fingerprint
    from bookings where client_idempotency_key = ${key}::uuid limit 1
  `) as unknown as (BookingResult & { idempotency_fingerprint: string })[];
  if (!rows[0]) return undefined;
  if (rows[0].idempotency_fingerprint !== expectedFingerprint) throw new DomainError("IDEMPOTENCY_CONFLICT", "Idempotency key was already used for another request.", 409);
  return rows[0];
}

async function customer(tx: Tx, input: CreateBookingRequest["customer"]) {
  const email = normalizeEmail(input.email);
  const whatsapp = normalizeWhatsApp(input.whatsapp);
  const found = await tx.execute(sql<{ id: string }>`select id from customers where email_normalized = ${email} or whatsapp_normalized = ${whatsapp} order by created_at limit 1`) as unknown as {id:string}[];
  if (found[0]) {
    await tx.execute(sql`update customers set full_name=${input.fullName}, email=${input.email}, email_normalized=${email}, whatsapp=${input.whatsapp}, whatsapp_normalized=${whatsapp}, updated_at=now() where id=${found[0].id}::uuid`);
    return { id: found[0].id, email, whatsapp };
  }
  const inserted = await tx.execute(sql<{ id: string }>`insert into customers (full_name,email,email_normalized,whatsapp,whatsapp_normalized) values (${input.fullName},${input.email},${email},${input.whatsapp},${whatsapp}) returning id`) as unknown as {id:string}[];
  return { id: inserted[0]!.id, email, whatsapp };
}

export async function quoteBooking(input: QuoteRequest, database: BookingDatabase = getDb()) {
  if (input.business === "glamping") {
    const product = await getAccommodationProduct(input.productSlug, database);
    const config = await settings("glamping", database);
    assertReservationDate(input.checkInDate, config.timezone);
    assertCapacity(input.guestCount, input.quantity, product.capacityPerUnit);
    const price = calculateGlampingPrice(product.basePrice, input.quantity, input.checkInDate, input.checkOutDate);
    return { ...price, dpPercentage: config.dp_percentage, requiredDpAmount: calculateDp(price.totalAmount, config.dp_percentage), currency: "IDR" as const };
  }
  const config = await settings("jeep", database);
  const row = await getJeepProduct(input.packageSlug, input.departureSlotId, database);
  assertJeepDepartureOpen(input.tourDate, row.slot.departureTime, config.timezone);
  assertCapacity(input.guestCount, input.quantity, row.package.capacityPerUnit);
  const price = calculateJeepPrice(row.package.pricePerUnit, input.quantity);
  return { ...price, dpPercentage: config.dp_percentage, requiredDpAmount: calculateDp(price.totalAmount, config.dp_percentage), currency: "IDR" as const };
}

export async function createGlampingBooking(input: Extract<CreateBookingRequest, { business: "glamping" }>, idempotencyKey: string, database: BookingDatabase = getDb()): Promise<BookingResult> {
  const canonical = { ...input, turnstileToken: undefined };
  const requestFingerprint = fingerprint(canonical);
  try {
    return await database.transaction(async (tx) => {
      const prior = await existing(tx, idempotencyKey, requestFingerprint); if (prior) return prior;
      const config = await settings("glamping", tx as BookingDatabase);
      const product = await getAccommodationProduct(input.reservation.productSlug, tx as BookingDatabase);
      assertReservationDate(input.reservation.checkInDate, config.timezone);
      assertCapacity(input.reservation.guestCount, input.reservation.quantity, product.capacityPerUnit);
      const price = calculateGlampingPrice(product.basePrice, input.reservation.quantity, input.reservation.checkInDate, input.reservation.checkOutDate);
      const units = await tx.execute(sql<{ id: string }>`
        select au.id from accommodation_units au where au.accommodation_type_id=${product.id}::uuid and au.is_active
        and not exists (select 1 from accommodation_unit_reservations r where r.accommodation_unit_id=au.id and r.state in ('HELD','CONFIRMED','IN_USE') and r.check_in_date < ${input.reservation.checkOutDate}::date and r.check_out_date > ${input.reservation.checkInDate}::date)
        and not exists (select 1 from inventory_blocks b where b.accommodation_unit_id=au.id and b.removed_at is null and b.start_date < ${input.reservation.checkOutDate}::date and b.end_date > ${input.reservation.checkInDate}::date)
        order by au.code for update of au skip locked limit ${input.reservation.quantity}
      `) as unknown as {id:string}[];
      if (units.length !== input.reservation.quantity) throw new DomainError("INVENTORY_NOT_AVAILABLE", "Requested accommodation inventory is not available.", 409);
      const owner = await customer(tx, input.customer); const code = await bookingCode(tx, config.code, config.timezone);
      const dp = calculateDp(price.totalAmount, config.dp_percentage); const expiresAt = new Date(Date.now() + config.booking_hold_minutes * 60_000);
      const created = await tx.execute(sql<{ id: string }>`insert into bookings (booking_code,business_id,customer_id,booking_type,status,payment_status,customer_name,customer_email,customer_whatsapp,customer_email_normalized,customer_whatsapp_normalized,guest_count,quantity,subtotal_amount,total_amount,dp_percentage,required_dp_amount,remaining_amount,special_request,client_idempotency_key,idempotency_fingerprint,expires_at) values (${code},${config.id}::uuid,${owner.id}::uuid,'ACCOMMODATION','WAITING_PAYMENT','UNPAID',${input.customer.fullName},${input.customer.email},${input.customer.whatsapp},${owner.email},${owner.whatsapp},${input.reservation.guestCount},${input.reservation.quantity},${price.subtotalAmount},${price.totalAmount},${config.dp_percentage},${dp},${price.totalAmount},${input.specialRequest ?? null},${idempotencyKey}::uuid,${requestFingerprint},${expiresAt.toISOString()}::timestamptz) returning id`) as unknown as {id:string}[];
      const bookingId = created[0]!.id;
      await tx.execute(sql`insert into glamping_booking_details (booking_id,accommodation_type_id,check_in_date,check_out_date,night_count,product_name_snapshot,unit_price_snapshot,capacity_snapshot) values (${bookingId}::uuid,${product.id}::uuid,${input.reservation.checkInDate}::date,${input.reservation.checkOutDate}::date,${price.nightCount},${product.name},${product.basePrice},${product.capacityPerUnit})`);
      for (const unit of units) await tx.execute(sql`insert into accommodation_unit_reservations (booking_id,accommodation_unit_id,check_in_date,check_out_date,state) values (${bookingId}::uuid,${unit.id}::uuid,${input.reservation.checkInDate}::date,${input.reservation.checkOutDate}::date,'HELD')`);
      await tx.execute(sql`insert into payments (booking_id,expected_amount,status) values (${bookingId}::uuid,${dp},'UNPAID')`);
      await tx.execute(sql`insert into booking_events (booking_id,event_type,actor_type,title,metadata) values (${bookingId}::uuid,'BOOKING_CREATED','CUSTOMER','Booking created',${JSON.stringify({ idempotencyKey })}::jsonb)`);
      return { bookingId, bookingCode: code, status: "WAITING_PAYMENT", paymentStatus: "UNPAID", totalAmount: price.totalAmount, requiredDpAmount: dp, expiresAt };
    });
  } catch (error) {
    if (isIdempotencyConstraintError(error)) {
      const prior = await database.transaction(tx => existing(tx, idempotencyKey, requestFingerprint));
      if (prior) return prior;
    }
    if (isInventoryConstraintError(error)) throw new DomainError("INVENTORY_NOT_AVAILABLE", "Requested accommodation inventory is no longer available.", 409); throw error;
  }
}

export async function createJeepBooking(input: Extract<CreateBookingRequest, { business: "jeep" }>, idempotencyKey: string, database: BookingDatabase = getDb()): Promise<BookingResult> {
  const canonical = { ...input, turnstileToken: undefined }; const requestFingerprint = fingerprint(canonical);
  try {
    return await database.transaction(async (tx) => {
      const prior = await existing(tx, idempotencyKey, requestFingerprint); if (prior) return prior;
      const config = await settings("jeep", tx as BookingDatabase);
      const row = await getJeepProduct(input.reservation.packageSlug, input.reservation.departureSlotId, tx as BookingDatabase);
      assertJeepDepartureOpen(input.reservation.tourDate, row.slot.departureTime, config.timezone); assertCapacity(input.reservation.guestCount, input.reservation.quantity, row.package.capacityPerUnit);
      const price = calculateJeepPrice(row.package.pricePerUnit, input.reservation.quantity);
      const units = await tx.execute(sql<{ id: string }>`select ju.id from jeep_units ju where ju.business_id=${config.id}::uuid and ju.is_active and not exists (select 1 from jeep_unit_reservations r where r.jeep_unit_id=ju.id and r.tour_date=${input.reservation.tourDate}::date and r.departure_slot_id=${row.slot.id}::uuid and r.state in ('HELD','CONFIRMED','IN_USE')) and not exists (select 1 from inventory_blocks b where b.jeep_unit_id=ju.id and b.removed_at is null and b.start_date=${input.reservation.tourDate}::date and (b.departure_slot_id is null or b.departure_slot_id=${row.slot.id}::uuid)) order by ju.code for update of ju skip locked limit ${input.reservation.quantity}`) as unknown as {id:string}[];
      if (units.length !== input.reservation.quantity) throw new DomainError("INVENTORY_NOT_AVAILABLE", "Requested Jeep inventory is not available.", 409);
      const owner = await customer(tx, input.customer); const code = await bookingCode(tx, config.code, config.timezone); const dp = calculateDp(price.totalAmount, config.dp_percentage); const expiresAt = new Date(Date.now() + config.booking_hold_minutes * 60_000);
      const created = await tx.execute(sql<{ id: string }>`insert into bookings (booking_code,business_id,customer_id,booking_type,status,payment_status,customer_name,customer_email,customer_whatsapp,customer_email_normalized,customer_whatsapp_normalized,guest_count,quantity,subtotal_amount,total_amount,dp_percentage,required_dp_amount,remaining_amount,special_request,client_idempotency_key,idempotency_fingerprint,expires_at) values (${code},${config.id}::uuid,${owner.id}::uuid,'JEEP','WAITING_PAYMENT','UNPAID',${input.customer.fullName},${input.customer.email},${input.customer.whatsapp},${owner.email},${owner.whatsapp},${input.reservation.guestCount},${input.reservation.quantity},${price.subtotalAmount},${price.totalAmount},${config.dp_percentage},${dp},${price.totalAmount},${input.specialRequest ?? null},${idempotencyKey}::uuid,${requestFingerprint},${expiresAt.toISOString()}::timestamptz) returning id`) as unknown as {id:string}[];
      const bookingId=created[0]!.id;
      await tx.execute(sql`insert into jeep_booking_details (booking_id,jeep_package_id,departure_slot_id,tour_date,package_name_snapshot,unit_price_snapshot,capacity_snapshot,departure_time_snapshot) values (${bookingId}::uuid,${row.package.id}::uuid,${row.slot.id}::uuid,${input.reservation.tourDate}::date,${row.package.name},${row.package.pricePerUnit},${row.package.capacityPerUnit},${row.slot.departureTime})`);
      for (const unit of units) await tx.execute(sql`insert into jeep_unit_reservations (booking_id,jeep_unit_id,departure_slot_id,tour_date,state) values (${bookingId}::uuid,${unit.id}::uuid,${row.slot.id}::uuid,${input.reservation.tourDate}::date,'HELD')`);
      await tx.execute(sql`insert into payments (booking_id,expected_amount,status) values (${bookingId}::uuid,${dp},'UNPAID')`); await tx.execute(sql`insert into booking_events (booking_id,event_type,actor_type,title,metadata) values (${bookingId}::uuid,'BOOKING_CREATED','CUSTOMER','Booking created',${JSON.stringify({idempotencyKey})}::jsonb)`);
      return { bookingId, bookingCode: code, status:"WAITING_PAYMENT", paymentStatus:"UNPAID", totalAmount:price.totalAmount, requiredDpAmount:dp, expiresAt };
    });
  } catch (error) {
    if (isIdempotencyConstraintError(error)) {
      const prior = await database.transaction(tx => existing(tx, idempotencyKey, requestFingerprint));
      if (prior) return prior;
    }
    if (isInventoryConstraintError(error)) throw new DomainError("INVENTORY_NOT_AVAILABLE", "Requested Jeep inventory is no longer available.",409); throw error;
  }
}

export async function createBooking(input: CreateBookingRequest, key: string, database: BookingDatabase = getDb()) { return input.business === "glamping" ? createGlampingBooking(input,key,database) : createJeepBooking(input,key,database); }
