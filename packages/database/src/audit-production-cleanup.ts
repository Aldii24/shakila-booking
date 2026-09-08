import postgres from "postgres";
import { getDatabaseUrl } from "./client";

const client = postgres(getDatabaseUrl(), { max: 1, prepare: false });

const [result] = await client.unsafe(`
  with seed_customers as (
    select c.id
    from customers c
    where c.id in (
      select md5('customer-' || i)::uuid from generate_series(1, 30) i
    )
      and c.email_normalized ~ '^demo[0-9]+@example\\.test$'
  ), uat_customers as (
    select c.id
    from customers c
    where c.id not in (select id from seed_customers)
      and (
        c.email_normalized like 'uat.prod.%@example.com'
        or c.email_normalized like 'production-smoke-%@example.com'
        or c.email_normalized in ('smoke-manual-payment@example.test', 'smoke-manual-booking@example.test')
      )
  ), seed_bookings as (
    select b.id
    from bookings b
    where (
      b.id in (select md5('glamp-booking-' || i)::uuid from generate_series(1, 29) i)
      or b.id in (select md5('jeep-booking-' || i)::uuid from generate_series(1, 19) i)
    )
      and b.customer_id in (select id from seed_customers)
      and b.customer_email_normalized ~ '^demo[0-9]+@example\\.test$'
  ), artifact_customers as (
    select id from seed_customers union select id from uat_customers
  ), artifact_bookings as (
    select id from bookings where customer_id in (select id from artifact_customers)
  )
  select json_build_object(
    'seedCustomers', (select count(*) from seed_customers),
    'uatCustomers', (select count(*) from uat_customers),
    'seedBookings', (select count(*) from seed_bookings),
    'seedPayments', (select count(*) from payments where booking_id in (select id from seed_bookings)),
    'seedPaymentAttempts', (select count(*) from payment_attempts where booking_id in (select id from seed_bookings)),
    'seedPaymentProofs', (select count(*) from payment_proofs where booking_id in (select id from seed_bookings)),
    'seedInvoices', (select count(*) from invoices where booking_id in (select id from seed_bookings)),
    'seedBookingEvents', (select count(*) from booking_events where booking_id in (select id from seed_bookings)),
    'seedAccommodationReservations', (select count(*) from accommodation_unit_reservations where booking_id in (select id from seed_bookings)),
    'seedJeepReservations', (select count(*) from jeep_unit_reservations where booking_id in (select id from seed_bookings)),
    'seedInventoryBlocks', (select count(*) from inventory_blocks where note = 'FAST-1 deterministic demo seed'),
    'artifactBookingsTotal', (select count(*) from artifact_bookings),
    'artifactPaymentsTotal', (select count(*) from payments where booking_id in (select id from artifact_bookings)),
    'artifactPaymentAttemptsTotal', (select count(*) from payment_attempts where booking_id in (select id from artifact_bookings)),
    'artifactPaymentProofsTotal', (select count(*) from payment_proofs where booking_id in (select id from artifact_bookings)),
    'artifactInvoicesTotal', (select count(*) from invoices where booking_id in (select id from artifact_bookings)),
    'artifactBookingEventsTotal', (select count(*) from booking_events where booking_id in (select id from artifact_bookings)),
    'artifactAccommodationReservationsTotal', (select count(*) from accommodation_unit_reservations where booking_id in (select id from artifact_bookings)),
    'artifactJeepReservationsTotal', (select count(*) from jeep_unit_reservations where booking_id in (select id from artifact_bookings)),
    'artifactGlampingDetailsTotal', (select count(*) from glamping_booking_details where booking_id in (select id from artifact_bookings)),
    'artifactJeepDetailsTotal', (select count(*) from jeep_booking_details where booking_id in (select id from artifact_bookings)),
    'artifactBundleDetailsTotal', (select count(*) from bundle_booking_details where booking_id in (select id from artifact_bookings)),
    'oldAccommodationTypes', (select count(*) from accommodation_types where slug in ('deluxe-dome', 'family-dome')),
    'oldAccommodationUnits', (
      select count(*) from accommodation_units u join accommodation_types t on t.id = u.accommodation_type_id
      where t.slug in ('deluxe-dome', 'family-dome')
    ),
    'oldJeepPackages', (select count(*) from jeep_packages where slug in ('sunrise-adventure', 'full-adventure-experience')),
    'oldJeepSlots', (
      select count(*) from jeep_departure_slots s join jeep_packages p on p.id = s.jeep_package_id
      where p.slug in ('sunrise-adventure', 'full-adventure-experience')
    ),
    'inventedDemoSlots', (select count(*) from jeep_departure_slots where is_demo_data or lower(name) like '%demo%'),
    'activeJeepUnits', (select count(*) from jeep_units where is_active),
    'clientAccommodationUnits', (
      select coalesce(json_object_agg(slug, unit_count), '{}'::json)
      from (
        select t.slug, count(u.id)::int as unit_count
        from accommodation_types t
        left join accommodation_units u on u.accommodation_type_id = t.id and u.is_active
        where t.slug in ('glamping-deluxe', 'glamping-twin-bed', 'homestay-standard', 'homestay-superior', 'homestay-twin-bed')
        group by t.slug order by t.slug
      ) counts
    ),
    'otherTestCustomers', (
      select count(*) from customers
      where id not in (select id from seed_customers)
        and (email_normalized like '%@example.test' or email_normalized like '%@example.com' or lower(full_name) ~ '(demo|uat|test)')
    ),
    'otherTestCustomerDetails', (
      select coalesce(json_agg(candidate order by candidate."createdAt"), '[]'::json)
      from (
        select c.id, c.full_name as name, c.email_normalized as email,
          c.created_at::text as "createdAt", count(b.id)::int as bookings,
          coalesce(json_agg(b.booking_code order by b.created_at) filter (where b.id is not null), '[]'::json) as "bookingCodes"
        from customers c left join bookings b on b.customer_id = c.id
        where c.id not in (select id from seed_customers)
          and (c.email_normalized like '%@example.test' or c.email_normalized like '%@example.com' or lower(c.full_name) ~ '(demo|uat|test)')
        group by c.id
      ) candidate
    )
  ) as audit
`);

console.log(JSON.stringify(result?.audit ?? {}, null, 2));
await client.end();
