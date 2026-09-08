import { sql } from "drizzle-orm";
import { getDb, type BookingDatabase } from "@booking/database";
import { DomainError } from "./errors";

type CalendarRange = { startDate: string; endDate: string };
type CalendarRow = Record<string, unknown> & { date: string };

const rows = <T>(value: unknown) => value as T[];

function assertCalendarRange({ startDate, endDate }: CalendarRange) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (!Number.isFinite(days) || days < 1 || days > 62) {
    throw new DomainError(
      "INVALID_DATE_RANGE",
      "Availability calendar range must contain between 1 and 62 days.",
      400,
    );
  }
}

function groupDays<T extends CalendarRow>(items: T[]) {
  const days = new Map<string, T[]>();
  for (const item of items) {
    const dateRows = days.get(item.date) ?? [];
    dateRows.push(item);
    days.set(item.date, dateRows);
  }
  return [...days].map(([date, inventory]) => ({ date, inventory }));
}

export async function getPublicGlampingCalendar(
  range: CalendarRange,
  database: BookingDatabase = getDb(),
) {
  assertCalendarRange(range);
  const result = rows<CalendarRow>(await database.execute(sql`
    with dates as (
      select d::date as business_date
      from generate_series(${range.startDate}::date, ${range.endDate}::date, '1 day') d
    )
    select
      d.business_date::text as "date",
      t.slug as "productSlug",
      t.name as "productName",
      t.base_price::int as "unitPrice",
      t.capacity_per_unit as "capacityPerUnit",
      count(u.id)::int as "totalUnits",
      count(u.id) filter(where exists(
        select 1 from accommodation_unit_reservations r
        where r.accommodation_unit_id=u.id and r.state='HELD'
          and d.business_date>=r.check_in_date and d.business_date<r.check_out_date
      ))::int as "heldUnits",
      count(u.id) filter(where exists(
        select 1 from accommodation_unit_reservations r
        where r.accommodation_unit_id=u.id and r.state in ('CONFIRMED','IN_USE')
          and d.business_date>=r.check_in_date and d.business_date<r.check_out_date
      ))::int as "confirmedUnits",
      count(u.id) filter(where exists(
        select 1 from inventory_blocks ib
        where ib.accommodation_unit_id=u.id and ib.removed_at is null
          and d.business_date>=ib.start_date and d.business_date<ib.end_date
      ))::int as "blockedUnits",
      count(u.id) filter(where
        not exists(
          select 1 from accommodation_unit_reservations r
          where r.accommodation_unit_id=u.id and r.state in ('HELD','CONFIRMED','IN_USE')
            and d.business_date>=r.check_in_date and d.business_date<r.check_out_date
        ) and not exists(
          select 1 from inventory_blocks ib
          where ib.accommodation_unit_id=u.id and ib.removed_at is null
            and d.business_date>=ib.start_date and d.business_date<ib.end_date
        )
      )::int as "availableUnits"
    from dates d
    cross join accommodation_types t
    join businesses b on b.id=t.business_id and b.slug='glamping' and b.is_active
    left join accommodation_units u on u.accommodation_type_id=t.id and u.is_active
    where t.is_active
    group by d.business_date,t.id
    order by d.business_date,t.sort_order,t.name
  `));
  return { business: "glamping", days: groupDays(result) };
}

export async function getPublicJeepCalendar(
  range: CalendarRange,
  database: BookingDatabase = getDb(),
) {
  assertCalendarRange(range);
  const result = rows<CalendarRow>(await database.execute(sql`
    with dates as (
      select d::date as business_date
      from generate_series(${range.startDate}::date, ${range.endDate}::date, '1 day') d
    )
    select
      d.business_date::text as "date",
      p.slug as "packageSlug",
      p.name as "packageName",
      p.price_per_unit::int as "unitPrice",
      p.capacity_per_unit as "capacityPerUnit",
      s.id::text as "departureSlotId",
      s.name as "slotName",
      s.departure_time::text as "departureTime",
      (d.business_date < (now() at time zone 'Asia/Jakarta')::date or
        (d.business_date = (now() at time zone 'Asia/Jakarta')::date and
         s.departure_time <= (now() at time zone 'Asia/Jakarta')::time)) as "bookingClosed",
      count(u.id)::int as "totalUnits",
      count(u.id) filter(where exists(
        select 1 from jeep_unit_reservations r join jeep_departure_slots rs on rs.id=r.departure_slot_id
        where r.jeep_unit_id=u.id and rs.departure_time=s.departure_time
          and r.tour_date=d.business_date and r.state='HELD'
      ))::int as "heldUnits",
      count(u.id) filter(where exists(
        select 1 from jeep_unit_reservations r join jeep_departure_slots rs on rs.id=r.departure_slot_id
        where r.jeep_unit_id=u.id and rs.departure_time=s.departure_time and r.tour_date=d.business_date
          and r.state in ('CONFIRMED','IN_USE')
      ))::int as "confirmedUnits",
      count(u.id) filter(where exists(
        select 1 from inventory_blocks ib left join jeep_departure_slots blocked_slot on blocked_slot.id=ib.departure_slot_id
        where ib.jeep_unit_id=u.id
          and ib.removed_at is null and ib.start_date=d.business_date
          and (ib.departure_slot_id is null or blocked_slot.departure_time=s.departure_time)
      ))::int as "blockedUnits",
      count(u.id) filter(where
        (d.business_date > (now() at time zone 'Asia/Jakarta')::date or
          (d.business_date = (now() at time zone 'Asia/Jakarta')::date and
           s.departure_time > (now() at time zone 'Asia/Jakarta')::time)) and
        not exists(
          select 1 from jeep_unit_reservations r join jeep_departure_slots rs on rs.id=r.departure_slot_id
          where r.jeep_unit_id=u.id and rs.departure_time=s.departure_time and r.tour_date=d.business_date
            and r.state in ('HELD','CONFIRMED','IN_USE')
        ) and not exists(
          select 1 from inventory_blocks ib left join jeep_departure_slots blocked_slot on blocked_slot.id=ib.departure_slot_id
          where ib.jeep_unit_id=u.id
            and ib.removed_at is null and ib.start_date=d.business_date
            and (ib.departure_slot_id is null or blocked_slot.departure_time=s.departure_time)
        )
      )::int as "availableUnits"
    from dates d
    cross join jeep_packages p
    join businesses b on b.id=p.business_id and b.slug='jeep' and b.is_active
    join jeep_departure_slots s on s.jeep_package_id=p.id and s.is_active
    left join jeep_units u on u.business_id=p.business_id and u.is_active
    where p.is_active
    group by d.business_date,p.id,s.id
    order by d.business_date,p.sort_order,p.name,s.departure_time
  `));
  return { business: "jeep", days: groupDays(result) };
}
