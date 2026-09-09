import postgres from "postgres";
import { getDatabaseUrl } from "./client";

const apply = process.argv.includes("--apply");
const client = postgres(getDatabaseUrl(), { max: 1, prepare: false });

async function counts(tx: postgres.TransactionSql) {
  const [row] = await tx.unsafe(`
    select
      (select count(*)::int from bookings) as bookings,
      (select count(*)::int from customers) as customers,
      (select count(*)::int from payments) as payments,
      (select count(*)::int from payment_attempts) as payment_attempts,
      (select count(*)::int from payment_proofs) as payment_proofs,
      (select count(*)::int from invoices) as invoices,
      (select count(*)::int from booking_events) as booking_events,
      (select count(*)::int from glamping_booking_details) as glamping_details,
      (select count(*)::int from jeep_booking_details) as jeep_details,
      (select count(*)::int from bundle_booking_details) as bundle_details,
      (select count(*)::int from accommodation_unit_reservations) as accommodation_reservations,
      (select count(*)::int from jeep_unit_reservations) as jeep_reservations,
      (select count(*)::int from inventory_blocks) as inventory_blocks,
      (select count(*)::int from accommodation_unit_reservations where state in ('HELD', 'CONFIRMED', 'IN_USE')) as active_accommodation_reservations,
      (select count(*)::int from jeep_unit_reservations where state in ('HELD', 'CONFIRMED', 'IN_USE')) as active_jeep_reservations,
      (select count(*)::int from inventory_blocks where removed_at is null) as active_inventory_blocks,
      (select count(*)::int from payments where status in ('UNPAID', 'PENDING', 'PARTIALLY_PAID')) as pending_payments,
      (select count(*)::int from payment_proofs where status = 'PENDING') as pending_payment_proofs,
      (select count(*)::int from businesses) as businesses,
      (select count(*)::int from business_settings) as business_settings,
      (select count(*)::int from accommodation_types) as accommodation_types,
      (select count(*)::int from accommodation_units) as accommodation_units,
      (select count(*)::int from jeep_packages) as jeep_packages,
      (select count(*)::int from jeep_departure_slots) as jeep_departure_slots,
      (select count(*)::int from jeep_units) as jeep_units,
      (select count(*)::int from bundle_packages) as bundle_packages
  `);
  return row;
}

const result = await client.begin(async (tx) => {
  await tx.unsafe(`
    lock table
      bookings,
      customers,
      payment_proofs,
      payment_attempts,
      invoices,
      booking_events,
      accommodation_unit_reservations,
      jeep_unit_reservations,
      payments,
      glamping_booking_details,
      jeep_booking_details,
      bundle_booking_details,
      inventory_blocks
    in share row exclusive mode
  `);
  await tx.unsafe(`create temporary table cleanup_target_bookings on commit drop as select id from bookings`);
  await tx.unsafe(`create temporary table cleanup_target_customers on commit drop as select distinct customer_id as id from bookings where customer_id is not null`);
  await tx.unsafe(`create temporary table cleanup_target_blocks on commit drop as
    select id from inventory_blocks
    where lower(coalesce(note, '')) ~ '(demo|uat|smoke|test|seed)'
       or lower(coalesce(reason, '')) ~ '(demo|uat|smoke|test|seed)'
  `);

  const before = await counts(tx);
  const [targets] = await tx.unsafe(`
    select
      (select count(*)::int from cleanup_target_bookings) as bookings,
      (select count(*)::int from cleanup_target_customers) as customers,
      (select count(*)::int from cleanup_target_blocks) as inventory_blocks
  `);

  if (apply) {
    await tx.unsafe(`delete from payment_proofs where booking_id in (select id from cleanup_target_bookings)`);
    await tx.unsafe(`delete from payment_attempts where booking_id in (select id from cleanup_target_bookings)`);
    await tx.unsafe(`delete from invoices where booking_id in (select id from cleanup_target_bookings)`);
    await tx.unsafe(`delete from booking_events where booking_id in (select id from cleanup_target_bookings)`);
    await tx.unsafe(`delete from accommodation_unit_reservations where booking_id in (select id from cleanup_target_bookings)`);
    await tx.unsafe(`delete from jeep_unit_reservations where booking_id in (select id from cleanup_target_bookings)`);
    await tx.unsafe(`delete from payments where booking_id in (select id from cleanup_target_bookings)`);
    await tx.unsafe(`delete from glamping_booking_details where booking_id in (select id from cleanup_target_bookings)`);
    await tx.unsafe(`delete from jeep_booking_details where booking_id in (select id from cleanup_target_bookings)`);
    await tx.unsafe(`delete from bundle_booking_details where booking_id in (select id from cleanup_target_bookings)`);
    await tx.unsafe(`delete from bookings where id in (select id from cleanup_target_bookings)`);
    await tx.unsafe(`delete from customers where id in (select id from cleanup_target_customers) and not exists (select 1 from bookings where bookings.customer_id = customers.id)`);
    await tx.unsafe(`delete from inventory_blocks where id in (select id from cleanup_target_blocks)`);
  }

  return { before, targets, after: await counts(tx) };
});

console.log(JSON.stringify({ mode: apply ? "APPLY" : "AUDIT_ONLY", ...result }, null, 2));
await client.end();
