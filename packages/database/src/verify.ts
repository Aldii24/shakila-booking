import postgres from "postgres";
import { getDatabaseUrl } from "./client";

const domainTables = [
  "businesses", "business_settings", "customers", "accommodation_types", "accommodation_units",
  "jeep_packages", "jeep_departure_slots", "jeep_units", "bookings", "glamping_booking_details",
  "jeep_booking_details", "accommodation_unit_reservations", "jeep_unit_reservations", "inventory_blocks",
  "payments", "payment_attempts", "invoices", "booking_events",
] as const;

const client = postgres(getDatabaseUrl(), { max: 1, prepare: false });
try {
  const present = await client<{ table_name: string }[]>`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_name in ${client(domainTables)} order by table_name
  `;
  const [counts] = await client<{
    businesses:number;customers:number;bookings:number;accommodation_units:number;jeep_units:number;payment_attempts:number;active_blocks:number;
  }[]>`select
    (select count(*)::int from businesses) businesses,
    (select count(*)::int from customers) customers,
    (select count(*)::int from bookings) bookings,
    (select count(*)::int from accommodation_units) accommodation_units,
    (select count(*)::int from jeep_units) jeep_units,
    (select count(*)::int from payment_attempts) payment_attempts,
    (select count(*)::int from inventory_blocks where removed_at is null) active_blocks`;
  const [guards] = await client<{btree_gist:boolean;accommodation_exclusion:boolean;jeep_unique:boolean}[]>`select
    exists(select 1 from pg_extension where extname='btree_gist') btree_gist,
    exists(select 1 from pg_constraint where conname='accommodation_reservations_no_active_overlap') accommodation_exclusion,
    exists(select 1 from pg_indexes where indexname='jeep_reservations_active_unique') jeep_unique`;
  const [invariants] = await client<{invalid_paid_booking:number;invalid_checkin:number;invalid_released_glamping:number;invalid_released_jeep:number}[]>`select
    count(*) filter(where status in ('CONFIRMED','CHECKED_IN','CHECKED_OUT','COMPLETED') and verified_paid_amount < required_dp_amount)::int invalid_paid_booking,
    count(*) filter(where status='CHECKED_IN' and checked_in_at is null)::int invalid_checkin,
    count(*) filter(where status in ('EXPIRED','CANCELLED') and exists(select 1 from accommodation_unit_reservations r where r.booking_id=bookings.id and r.state<>'RELEASED'))::int invalid_released_glamping,
    count(*) filter(where status in ('EXPIRED','CANCELLED') and exists(select 1 from jeep_unit_reservations r where r.booking_id=bookings.id and r.state<>'RELEASED'))::int invalid_released_jeep
    from bookings`;
  if (present.length !== domainTables.length || !guards?.btree_gist || !guards.accommodation_exclusion || !guards.jeep_unique || Object.values(invariants ?? {}).some(value => value !== 0)) {
    throw new Error("Database verification failed.");
  }
  console.info(JSON.stringify({ domainTables: present.length, counts, guards, invariants }));
} finally {
  await client.end();
}
