import { sql } from "drizzle-orm";
import { getDb, type BookingDatabase } from "@booking/database";
import { cancelBooking, checkInBooking, checkOutBooking, completeJeepBooking } from "./lifecycle";
import { DomainError } from "./errors";

const rows = <T>(value: unknown) => value as T[];
export type AdminListFilters = {
  business?: string | null;
  status?: string | null;
  paymentStatus?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  search?: string | null;
  method?: string | null;
  provider?: string | null;
  requiresReview?: boolean | null;
  sort?: "createdAt" | "paidAt" | "requestedAmount" | "verifiedAmount";
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export async function getAdminOverview(
  business: string | null = null,
  database: BookingDatabase = getDb(),
) {
  const result = rows<Record<string, number>>(
    await database.execute(sql`
    select count(*)::int as "totalBookings",
      count(*) filter(where b.created_at::date=(now() at time zone 'Asia/Jakarta')::date)::int as "newToday",
      count(*) filter(where b.status='WAITING_PAYMENT')::int as "waitingPayment",
      count(*) filter(where b.status='CONFIRMED')::int as confirmed,
      count(*) filter(where b.status='CHECKED_IN')::int as "checkedIn",
      coalesce(sum(b.total_amount) filter(where b.status not in ('CANCELLED','EXPIRED')),0)::int as "bookingValue",
      coalesce(sum(b.verified_paid_amount),0)::int as revenue,
      coalesce(sum(b.remaining_amount) filter(where b.status not in ('CANCELLED','EXPIRED')),0)::int as outstanding
    from bookings b join businesses bu on bu.id=b.business_id where (${business}::text is null or bu.slug=${business})
  `),
  )[0];
  const recent = await listAdminBookings({ business, pageSize: 6 }, database);
  const chart = rows<{ day: string; bookings: number; revenue: number }>(
    await database.execute(sql`
    select d::date::text as "day",count(b.id)::int as bookings,coalesce(sum(b.verified_paid_amount),0)::int as revenue
    from generate_series((now() at time zone 'Asia/Jakarta')::date-6,(now() at time zone 'Asia/Jakarta')::date,'1 day') d
    left join bookings b on b.created_at::date=d::date and (${business}::text is null or b.business_id=(select id from businesses where slug=${business}))
    group by d order by d
  `),
  );
  const breakdown = rows<Record<string, unknown>>(
    await database.execute(
      sql`select bu.slug as business,bu.name,count(b.id)::int as bookings,coalesce(sum(b.total_amount) filter(where b.status not in ('CANCELLED','EXPIRED')),0)::int as "bookingValue",coalesce(sum(b.verified_paid_amount),0)::int as revenue from businesses bu left join bookings b on b.business_id=bu.id where (${business}::text is null or bu.slug=${business}) group by bu.id order by bu.slug`,
    ),
  );
  const upcoming =
    rows<{ count: number }>(
      await database.execute(
        sql`select count(*)::int count from bookings b join businesses bu on bu.id=b.business_id left join glamping_booking_details g on g.booking_id=b.id left join jeep_booking_details j on j.booking_id=b.id where b.status in ('CONFIRMED','CHECKED_IN') and (${business}::text is null or bu.slug=${business}) and coalesce(g.check_in_date,j.tour_date) between (now() at time zone 'Asia/Jakarta')::date and (now() at time zone 'Asia/Jakarta')::date+7`,
      ),
    )[0]?.count ?? 0;
  return { ...result, upcoming, recent: recent.items, chart, breakdown };
}

export async function listAdminBookings(
  filters: AdminListFilters = {},
  database: BookingDatabase = getDb(),
) {
  const page = Math.max(1, filters.page ?? 1),
    pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20)),
    offset = (page - 1) * pageSize,
    search = filters.search?.trim() || null;
  const where = sql`where (${filters.business ?? null}::text is null or bu.slug=${filters.business ?? null}) and (${filters.status ?? null}::text is null or b.status::text=${filters.status ?? null}) and (${filters.paymentStatus ?? null}::text is null or b.payment_status::text=${filters.paymentStatus ?? null}) and (${filters.dateFrom ?? null}::date is null or coalesce(g.check_in_date,j.tour_date)>=${filters.dateFrom ?? null}::date) and (${filters.dateTo ?? null}::date is null or coalesce(g.check_in_date,j.tour_date)<=${filters.dateTo ?? null}::date) and (${search}::text is null or b.booking_code ilike ${search ? `%${search}%` : null} or b.customer_name ilike ${search ? `%${search}%` : null} or b.customer_email ilike ${search ? `%${search}%` : null} or b.customer_whatsapp ilike ${search ? `%${search}%` : null})`;
  const items = rows<Record<string, unknown>>(
    await database.execute(sql`
    select b.id,b.booking_code as "bookingCode",bu.slug as business,bu.name as "businessName",b.booking_type as "bookingType",b.booking_source as "bookingSource",b.admin_notes as "adminNotes",b.status,b.payment_status as "paymentStatus",b.customer_name as "customerName",b.customer_email as "customerEmail",b.customer_whatsapp as "customerWhatsapp",coalesce(g.product_name_snapshot,j.package_name_snapshot) as "productName",coalesce(g.check_in_date,j.tour_date)::text as "startDate",g.check_out_date::text as "endDate",j.departure_time_snapshot::text as "departureTime",b.quantity,b.guest_count as "guestCount",b.total_amount::int as "totalAmount",b.dp_percentage as "dpPercentage",b.required_dp_amount::int as "requiredDpAmount",b.verified_paid_amount::int as "verifiedPaidAmount",b.remaining_amount::int as "remainingAmount",b.requires_review as "requiresReview",b.expires_at::text as "expiresAt",b.created_at::text as "createdAt"
    from bookings b join businesses bu on bu.id=b.business_id left join glamping_booking_details g on g.booking_id=b.id left join jeep_booking_details j on j.booking_id=b.id ${where} order by b.created_at desc limit ${pageSize} offset ${offset}
  `),
  );
  const count =
    rows<{ count: number }>(
      await database.execute(
        sql`select count(*)::int count from bookings b join businesses bu on bu.id=b.business_id left join glamping_booking_details g on g.booking_id=b.id left join jeep_booking_details j on j.booking_id=b.id ${where}`,
      ),
    )[0]?.count ?? 0;
  return {
    items,
    page,
    pageSize,
    total: count,
    totalPages: Math.ceil(count / pageSize),
  };
}

export async function getAdminBooking(
  bookingCode: string,
  database: BookingDatabase = getDb(),
) {
  const booking = (
    await listAdminBookings({ search: bookingCode, pageSize: 100 }, database)
  ).items.find((item) => item.bookingCode === bookingCode) as
    Record<string, unknown> | undefined;
  if (!booking)
    throw new DomainError("BOOKING_NOT_FOUND", "Booking was not found.", 404);
  const id = String(booking.id);
  const [events, attempts, reservations, invoice] = await Promise.all([
    database.execute(
      sql`select id,event_type as "eventType",actor_type as "actorType",title,description,metadata,created_at::text as "createdAt" from booking_events where booking_id=${id}::uuid order by created_at desc`,
    ),
    database.execute(
      sql`select id,provider,provider_order_id as "orderId",provider_transaction_id as "transactionId",requested_amount::int as "requestedAmount",verified_amount::int as "verifiedAmount",status,payment_method as "paymentMethod",created_at::text as "createdAt",verified_at::text as "verifiedAt" from payment_attempts where booking_id=${id}::uuid order by created_at desc`,
    ),
    database.execute(
      sql`select 'GLAMPING' type,u.code,u.name,r.check_in_date::text as "startDate",r.check_out_date::text as "endDate",null::text as "slotName",r.state from accommodation_unit_reservations r join accommodation_units u on u.id=r.accommodation_unit_id where r.booking_id=${id}::uuid union all select 'JEEP',u.code,u.name,r.tour_date::text,r.tour_date::text,s.name,r.state from jeep_unit_reservations r join jeep_units u on u.id=r.jeep_unit_id join jeep_departure_slots s on s.id=r.departure_slot_id where r.booking_id=${id}::uuid`,
    ),
    database.execute(
      sql`select invoice_number as "invoiceNumber",status,paid_amount::int as "paidAmount",remaining_amount::int as "remainingAmount",file_name as "fileName",issued_at::text as "issuedAt" from invoices where booking_id=${id}::uuid limit 1`,
    ),
  ]);
  return {
    ...booking,
    events: rows(events),
    paymentAttempts: rows(attempts),
    reservations: rows(reservations),
    invoice: rows(invoice)[0] ?? null,
  };
}

export async function adminBookingCommand(
  bookingCode: string,
  command: "check-in" | "check-out" | "complete" | "cancel",
  details: { reason?: string; note?: string; confirmEarlyCheckout?: boolean } = {},
  database: BookingDatabase = getDb(),
  instant?: Date,
) {
  const found = rows<{ id: string; status: string }>(
    await database.execute(
      sql`select id,status from bookings where booking_code=${bookingCode} limit 1`,
    ),
  )[0];
  if (!found)
    throw new DomainError("BOOKING_NOT_FOUND", "Booking was not found.", 404);
  if (command === "cancel" && !details.reason?.trim())
    throw new DomainError(
      "VALIDATION_ERROR",
      "A cancellation reason is required.",
      400,
    );
  const desired =
    command === "check-in"
      ? "CHECKED_IN"
      : command === "check-out"
        ? "CHECKED_OUT"
        : command === "complete"
          ? "COMPLETED"
        : "CANCELLED";
  if (found.status === desired)
    return { bookingId: found.id, status: desired, duplicate: true };
  const result =
    command === "check-in"
      ? await checkInBooking(found.id, database, { instant })
      : command === "check-out"
        ? await checkOutBooking(found.id, database, {
            confirmEarlyCheckout: details.confirmEarlyCheckout === true,
          })
        : command === "complete"
          ? await completeJeepBooking(found.id, database)
        : await cancelBooking(found.id, database);
  await database.execute(
    sql`update booking_events set actor_type='ADMIN',description=case when ${command}='cancel' then ${details.note ?? null} else description end,metadata=case when ${command}='cancel' then ${JSON.stringify({ reason: details.reason ?? null })}::jsonb else metadata end where id=(select id from booking_events where booking_id=${found.id}::uuid order by created_at desc limit 1)`,
  );
  return { ...result, duplicate: false };
}

export async function listAdminPayments(
  filters: AdminListFilters = {},
  database: BookingDatabase = getDb(),
) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const offset = (page - 1) * pageSize;
  const search = filters.search?.trim() || null;
  const orderColumn =
    filters.sort === "paidAt"
      ? sql`a.provider_paid_at`
      : filters.sort === "requestedAmount"
        ? sql`a.requested_amount`
        : filters.sort === "verifiedAmount"
          ? sql`a.verified_amount`
          : sql`a.created_at`;
  const orderDirection = filters.order === "asc" ? sql`asc` : sql`desc`;
  const where = sql`where
    (${filters.business ?? null}::text is null or bu.slug=${filters.business ?? null})
    and (${filters.status ?? null}::text is null or a.status::text=${filters.status ?? null})
    and (${filters.method ?? null}::text is null or a.payment_method=${filters.method ?? null})
    and (${filters.provider ?? null}::text is null or a.provider=${filters.provider ?? null})
    and (${filters.requiresReview ?? null}::boolean is null or b.requires_review=${filters.requiresReview ?? null})
    and (${filters.dateFrom ?? null}::date is null or coalesce(a.provider_paid_at,a.created_at)::date>=${filters.dateFrom ?? null}::date)
    and (${filters.dateTo ?? null}::date is null or coalesce(a.provider_paid_at,a.created_at)::date<=${filters.dateTo ?? null}::date)
    and (${search}::text is null
      or b.booking_code ilike ${search ? `%${search}%` : null}
      or b.customer_name ilike ${search ? `%${search}%` : null}
      or b.customer_email ilike ${search ? `%${search}%` : null}
      or b.customer_whatsapp ilike ${search ? `%${search}%` : null}
      or a.provider_order_id ilike ${search ? `%${search}%` : null}
      or a.provider_transaction_id ilike ${search ? `%${search}%` : null}
      or a.raw_reference ilike ${search ? `%${search}%` : null})`;
  const items = rows<Record<string, unknown>>(await database.execute(sql`
    select a.id,b.booking_code as "bookingCode",bu.slug as business,b.customer_name as "customerName",
      b.customer_email as "customerEmail",b.customer_whatsapp as "customerWhatsapp",b.requires_review as "requiresReview",
      a.provider,a.provider_order_id as "orderId",a.provider_transaction_id as "transactionId",
      a.requested_amount::int as "requestedAmount",a.verified_amount::int as "verifiedAmount",a.status,
      a.payment_method as "paymentMethod",a.created_at::text as "createdAt",a.provider_paid_at::text as "paidAt",a.verified_at::text as "verifiedAt"
    from payment_attempts a join bookings b on b.id=a.booking_id join businesses bu on bu.id=b.business_id
    ${where} order by ${orderColumn} ${orderDirection} nulls last,a.id desc limit ${pageSize} offset ${offset}
  `));
  const total = rows<{ count: number }>(await database.execute(sql`select count(*)::int count from payment_attempts a join bookings b on b.id=a.booking_id join businesses bu on bu.id=b.business_id ${where}`))[0]?.count ?? 0;
  const methods = rows<{ value: string }>(await database.execute(sql`select distinct payment_method as value from payment_attempts where payment_method is not null order by payment_method`)).map((item) => item.value);
  return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize), methods };
}
export async function listAdminCustomers(
  search: string | null = null,
  database: BookingDatabase = getDb(),
) {
  const term = search?.trim() || null;
  return rows<Record<string, unknown>>(
    await database.execute(
      sql`select c.id,c.full_name as "fullName",c.email,c.whatsapp,count(b.id)::int as "bookingCount",coalesce(sum(b.total_amount),0)::int as "bookingValue",coalesce(sum(b.verified_paid_amount),0)::int as "verifiedSpending",string_agg(distinct bu.slug,', ' order by bu.slug) as businesses,max(b.created_at)::text as "lastBookingAt" from customers c left join bookings b on b.customer_id=c.id left join businesses bu on bu.id=b.business_id where (${term}::text is null or c.full_name ilike ${term ? `%${term}%` : null} or c.email ilike ${term ? `%${term}%` : null} or c.whatsapp ilike ${term ? `%${term}%` : null}) group by c.id order by max(b.created_at) desc nulls last limit 100`,
    ),
  );
}
export async function getAdminCustomer(
  id: string,
  database: BookingDatabase = getDb(),
) {
  const customer = rows<Record<string, unknown>>(
    await database.execute(
      sql`select c.id,c.full_name as "fullName",c.email,c.whatsapp,c.created_at::text as "createdAt",count(b.id)::int as "bookingCount",coalesce(sum(b.verified_paid_amount),0)::int as "verifiedSpending",string_agg(distinct bu.slug,', ' order by bu.slug) as businesses from customers c left join bookings b on b.customer_id=c.id left join businesses bu on bu.id=b.business_id where c.id=${id}::uuid group by c.id`,
    ),
  )[0];
  if (!customer)
    throw new DomainError("BOOKING_NOT_FOUND", "Customer was not found.", 404);
  return {
    ...customer,
    bookings: (
      await listAdminBookings(
        { search: String(customer.email), pageSize: 100 },
        database,
      )
    ).items,
  };
}
export async function getAdminCalendar(
  startDate: string,
  endDate: string,
  business: string | null = null,
  database: BookingDatabase = getDb(),
) {
  const bookings = rows<Record<string, unknown>>(
    await database.execute(
      sql`select b.booking_code as "bookingCode",bu.slug as business,b.status,b.customer_name as "customerName",coalesce(g.product_name_snapshot,j.package_name_snapshot) as "productName",coalesce(g.check_in_date,j.tour_date)::text as "startDate",coalesce(g.check_out_date,j.tour_date)::text as "endDate",j.departure_time_snapshot::text as "departureTime" from bookings b join businesses bu on bu.id=b.business_id left join glamping_booking_details g on g.booking_id=b.id left join jeep_booking_details j on j.booking_id=b.id where b.status not in ('CANCELLED','EXPIRED') and (${business}::text is null or bu.slug=${business}) and ((g.booking_id is not null and g.check_in_date<=${endDate}::date and g.check_out_date>${startDate}::date) or (j.booking_id is not null and j.tour_date between ${startDate}::date and ${endDate}::date)) order by coalesce(g.check_in_date,j.tour_date),b.booking_code`,
    ),
  );
  const capacity = rows<Record<string, unknown>>(
    await database.execute(sql`
    with dates as (select d::date as business_date from generate_series(${startDate}::date,${endDate}::date,'1 day') d), glamping as (
      select d.business_date::text as "date",'glamping' business,null::text as "departureSlotId",null::text as "slotName",count(u.id)::int total,
        count(u.id) filter(where exists(select 1 from accommodation_unit_reservations r where r.accommodation_unit_id=u.id and r.state='HELD' and d.business_date>=r.check_in_date and d.business_date<r.check_out_date))::int held,
        count(u.id) filter(where exists(select 1 from accommodation_unit_reservations r where r.accommodation_unit_id=u.id and r.state in ('CONFIRMED','IN_USE') and d.business_date>=r.check_in_date and d.business_date<r.check_out_date))::int confirmed,
        count(u.id) filter(where exists(select 1 from inventory_blocks ib where ib.accommodation_unit_id=u.id and ib.removed_at is null and d.business_date>=ib.start_date and d.business_date<ib.end_date))::int blocked,
        count(u.id) filter(where not exists(select 1 from accommodation_unit_reservations r where r.accommodation_unit_id=u.id and r.state in ('HELD','CONFIRMED','IN_USE') and d.business_date>=r.check_in_date and d.business_date<r.check_out_date) and not exists(select 1 from inventory_blocks ib where ib.accommodation_unit_id=u.id and ib.removed_at is null and d.business_date>=ib.start_date and d.business_date<ib.end_date))::int available
      from dates d cross join accommodation_units u where u.is_active group by d.business_date
    ), jeep as (
      select d.business_date::text as "date",'jeep' business,s.id::text as "departureSlotId",s.name as "slotName",count(u.id)::int total,
        count(u.id) filter(where exists(select 1 from jeep_unit_reservations r join jeep_departure_slots rs on rs.id=r.departure_slot_id where r.jeep_unit_id=u.id and rs.departure_time is not distinct from s.departure_time and r.tour_date=d.business_date and r.state='HELD'))::int held,
        count(u.id) filter(where exists(select 1 from jeep_unit_reservations r join jeep_departure_slots rs on rs.id=r.departure_slot_id where r.jeep_unit_id=u.id and rs.departure_time is not distinct from s.departure_time and r.tour_date=d.business_date and r.state in ('CONFIRMED','IN_USE')))::int confirmed,
        count(u.id) filter(where exists(select 1 from inventory_blocks ib left join jeep_departure_slots blocked_slot on blocked_slot.id=ib.departure_slot_id where ib.jeep_unit_id=u.id and ib.removed_at is null and ib.start_date=d.business_date and (ib.departure_slot_id is null or blocked_slot.departure_time is not distinct from s.departure_time)))::int blocked,
        count(u.id) filter(where not exists(select 1 from jeep_unit_reservations r join jeep_departure_slots rs on rs.id=r.departure_slot_id where r.jeep_unit_id=u.id and rs.departure_time is not distinct from s.departure_time and r.tour_date=d.business_date and r.state in ('HELD','CONFIRMED','IN_USE')) and not exists(select 1 from inventory_blocks ib left join jeep_departure_slots blocked_slot on blocked_slot.id=ib.departure_slot_id where ib.jeep_unit_id=u.id and ib.removed_at is null and ib.start_date=d.business_date and (ib.departure_slot_id is null or blocked_slot.departure_time is not distinct from s.departure_time)))::int available
      from dates d cross join jeep_units u cross join jeep_departure_slots s where u.is_active and s.is_active group by d.business_date,s.id,s.name
    ) select * from glamping where (${business}::text is null or ${business}='glamping') union all select * from jeep where (${business}::text is null or ${business}='jeep') order by "date",business,"slotName"
  `),
  );
  return { bookings, capacity };
}

export async function getAdminInventory(database: BookingDatabase = getDb()) {
  const units = rows<Record<string, unknown>>(
    await database.execute(
      sql`select u.id,'ACCOMMODATION_UNIT' as "resourceType",u.code,u.name,t.name as "productName",bu.slug as business,u.is_active as "isActive" from accommodation_units u join accommodation_types t on t.id=u.accommodation_type_id join businesses bu on bu.id=t.business_id union all select u.id,'JEEP_UNIT',u.code,u.name,'Fleet',bu.slug,u.is_active from jeep_units u join businesses bu on bu.id=u.business_id order by business,"resourceType",code`,
    ),
  );
  const blocks = rows<Record<string, unknown>>(
    await database.execute(
      sql`select ib.id,bu.slug as business,ib.resource_type as "resourceType",coalesce(au.code,ju.code) as "unitCode",ib.accommodation_unit_id as "accommodationUnitId",ib.jeep_unit_id as "jeepUnitId",ib.start_date::text as "startDate",ib.end_date::text as "endDate",s.name as "slotName",ib.departure_slot_id as "departureSlotId",ib.reason,ib.note,ib.created_at::text as "createdAt" from inventory_blocks ib join businesses bu on bu.id=ib.business_id left join accommodation_units au on au.id=ib.accommodation_unit_id left join jeep_units ju on ju.id=ib.jeep_unit_id left join jeep_departure_slots s on s.id=ib.departure_slot_id where ib.removed_at is null order by ib.start_date desc`,
    ),
  );
  return { units, blocks };
}

export type InventoryBlockInput = {
  resourceType: "ACCOMMODATION_UNIT" | "JEEP_UNIT";
  unitId: string;
  startDate: string;
  endDate?: string;
  departureSlotId?: string;
  reason: string;
  note?: string;
};
export async function createInventoryBlock(
  input: InventoryBlockInput,
  database: BookingDatabase = getDb(),
) {
  return database.transaction(async (tx) => {
    if (input.resourceType === "ACCOMMODATION_UNIT") {
      if (!input.endDate || input.endDate <= input.startDate)
        throw new DomainError(
          "INVALID_DATE_RANGE",
          "Block end date must be after start date.",
          400,
        );
      const conflict = rows<{ exists: boolean }>(
        await tx.execute(
          sql`select exists(select 1 from accommodation_unit_reservations where accommodation_unit_id=${input.unitId}::uuid and state in ('HELD','CONFIRMED','IN_USE') and daterange(check_in_date,check_out_date,'[)') && daterange(${input.startDate}::date,${input.endDate}::date,'[)')) exists`,
        ),
      )[0];
      if (conflict?.exists)
        throw new DomainError(
          "INVENTORY_NOT_AVAILABLE",
          "Unit has an active reservation in this date range.",
          409,
        );
      const result = rows<Record<string, unknown>>(
        await tx.execute(
          sql`insert into inventory_blocks(business_id,resource_type,accommodation_unit_id,start_date,end_date,reason,note) select t.business_id,'ACCOMMODATION_UNIT',u.id,${input.startDate}::date,${input.endDate}::date,${input.reason},${input.note ?? null} from accommodation_units u join accommodation_types t on t.id=u.accommodation_type_id where u.id=${input.unitId}::uuid returning id`,
        ),
      );
      if (!result[0])
        throw new DomainError("PRODUCT_NOT_FOUND", "Unit was not found.", 404);
      return result[0];
    }
    if (!input.departureSlotId)
      throw new DomainError(
        "INVALID_DEPARTURE_SLOT",
        "Departure slot is required.",
        400,
      );
    const conflict = rows<{ exists: boolean }>(
      await tx.execute(
        sql`select exists(select 1 from jeep_unit_reservations r join jeep_departure_slots reserved_slot on reserved_slot.id=r.departure_slot_id join jeep_departure_slots requested_slot on requested_slot.id=${input.departureSlotId}::uuid where r.jeep_unit_id=${input.unitId}::uuid and r.tour_date=${input.startDate}::date and reserved_slot.departure_time is not distinct from requested_slot.departure_time and r.state in ('HELD','CONFIRMED','IN_USE')) exists`,
      ),
    )[0];
    if (conflict?.exists)
      throw new DomainError(
        "INVENTORY_NOT_AVAILABLE",
        "Jeep has an active reservation for this slot.",
        409,
      );
    const result = rows<Record<string, unknown>>(
      await tx.execute(
        sql`insert into inventory_blocks(business_id,resource_type,jeep_unit_id,start_date,departure_slot_id,reason,note) select u.business_id,'JEEP_UNIT',u.id,${input.startDate}::date,${input.departureSlotId}::uuid,${input.reason},${input.note ?? null} from jeep_units u where u.id=${input.unitId}::uuid returning id`,
      ),
    );
    if (!result[0])
      throw new DomainError("PRODUCT_NOT_FOUND", "Jeep was not found.", 404);
    return result[0];
  });
}
export async function removeInventoryBlock(
  id: string,
  database: BookingDatabase = getDb(),
) {
  const result = rows<{ id: string }>(
    await database.execute(
      sql`update inventory_blocks set removed_at=now(),updated_at=now() where id=${id}::uuid and removed_at is null returning id`,
    ),
  );
  if (!result[0])
    throw new DomainError(
      "PRODUCT_NOT_FOUND",
      "Inventory block was not found.",
      404,
    );
  return { id, removed: true };
}

export async function getAdminCatalog(database: BookingDatabase = getDb()) {
  const [glamping, jeep, settings, slots] = await Promise.all([
    database.execute(
      sql`select t.id,t.slug,t.name,t.kind,t.description,t.base_price::int as price,t.capacity_per_unit as capacity,t.breakfast_included_pax as "breakfastIncludedPax",t.facilities,t.media_key as "mediaKey",t.is_demo_data as "isDemoData",t.is_active as "isActive",(select count(*)::int from accommodation_units u where u.accommodation_type_id=t.id and u.is_active) as "unitCount" from accommodation_types t order by t.sort_order`,
    ),
    database.execute(
      sql`select p.id,p.slug,p.name,p.description,p.price_per_unit::int as price,p.capacity_per_unit as capacity,p.routes,p.facilities,p.media_key as "mediaKey",p.is_demo_data as "isDemoData",p.is_active as "isActive",(select count(*)::int from jeep_units u where u.business_id=p.business_id and u.is_active) as "fleetCount" from jeep_packages p order by p.sort_order`,
    ),
    database.execute(
      sql`select s.id,bu.slug as business,bu.timezone,s.dp_percentage as "dpPercentage",s.booking_hold_minutes as "bookingHoldMinutes",s.contact_email as "contactEmail",s.contact_phone as "contactPhone",s.default_check_in_time::text as "checkInTime",s.default_check_out_time::text as "checkOutTime" from business_settings s join businesses bu on bu.id=s.business_id order by bu.slug`,
    ),
    database.execute(
      sql`select id,jeep_package_id as "jeepPackageId",name,departure_time::text as "departureTime",is_demo_data as "isDemoData",is_active as "isActive" from jeep_departure_slots order by departure_time`,
    ),
  ]);
  return {
    glamping: rows(glamping),
    jeep: rows(jeep),
    settings: rows(settings),
    slots: rows(slots),
  };
}
export async function updateAdminProduct(
  kind: "glamping" | "jeep",
  id: string,
  input: {
    name?: string;
    description?: string;
    price?: number;
    capacity?: number;
    isActive?: boolean;
  },
  database: BookingDatabase = getDb(),
) {
  if (input.price !== undefined && input.price <= 0)
    throw new DomainError("VALIDATION_ERROR", "Price must be positive.", 400);
  if (input.capacity !== undefined && input.capacity <= 0)
    throw new DomainError("VALIDATION_ERROR", "Capacity must be positive.", 400);
  const table =
      kind === "glamping" ? sql`accommodation_types` : sql`jeep_packages`,
    priceColumn = kind === "glamping" ? sql`base_price` : sql`price_per_unit`;
  const result = rows<Record<string, unknown>>(
    await database.execute(
      sql`update ${table} set name=coalesce(${input.name ?? null},name),description=coalesce(${input.description ?? null},description),${priceColumn}=coalesce(${input.price ?? null},${priceColumn}),capacity_per_unit=coalesce(${input.capacity ?? null},capacity_per_unit),is_active=coalesce(${input.isActive ?? null},is_active),updated_at=now() where id=${id}::uuid returning id,name,is_active as "isActive"`,
    ),
  );
  if (!result[0])
    throw new DomainError("PRODUCT_NOT_FOUND", "Product was not found.", 404);
  return result[0];
}

export type CatalogRemovalResult = {
  id: string;
  disposition: "DELETED" | "ARCHIVED";
};

export async function removeAdminProduct(
  kind: "glamping" | "jeep",
  id: string,
  database: BookingDatabase = getDb(),
): Promise<CatalogRemovalResult> {
  return database.transaction(async (tx) => {
    if (kind === "glamping") {
      const current = rows<{ id: string }>(await tx.execute(sql`select id from accommodation_types where id=${id}::uuid for update`))[0];
      if (!current) throw new DomainError("PRODUCT_NOT_FOUND", "Accommodation type was not found.", 404);
      const history = rows<{ exists: boolean }>(await tx.execute(sql`
        select exists(
          select 1 from glamping_booking_details where accommodation_type_id=${id}::uuid
          union all select 1 from bundle_booking_details bd join bundle_packages bp on bp.id=bd.bundle_package_id where bp.accommodation_type_id=${id}::uuid
          union all select 1 from accommodation_unit_reservations r join accommodation_units u on u.id=r.accommodation_unit_id where u.accommodation_type_id=${id}::uuid
          union all select 1 from inventory_blocks b join accommodation_units u on u.id=b.accommodation_unit_id where u.accommodation_type_id=${id}::uuid
          union all select 1 from bundle_packages where accommodation_type_id=${id}::uuid
        ) as exists
      `))[0];
      if (history?.exists) {
        await tx.execute(sql`update accommodation_types set is_active=false,updated_at=now() where id=${id}::uuid`);
        await tx.execute(sql`update accommodation_units set is_active=false,updated_at=now() where accommodation_type_id=${id}::uuid`);
        return { id, disposition: "ARCHIVED" };
      }
      await tx.execute(sql`delete from accommodation_units where accommodation_type_id=${id}::uuid`);
      await tx.execute(sql`delete from accommodation_types where id=${id}::uuid`);
      return { id, disposition: "DELETED" };
    }

    const current = rows<{ id: string }>(await tx.execute(sql`select id from jeep_packages where id=${id}::uuid for update`))[0];
    if (!current) throw new DomainError("PRODUCT_NOT_FOUND", "Jeep package was not found.", 404);
    const history = rows<{ exists: boolean }>(await tx.execute(sql`
      select exists(
        select 1 from jeep_booking_details where jeep_package_id=${id}::uuid
        union all select 1 from bundle_booking_details bd join bundle_packages bp on bp.id=bd.bundle_package_id where bp.jeep_package_id=${id}::uuid
        union all select 1 from jeep_unit_reservations r join jeep_departure_slots s on s.id=r.departure_slot_id where s.jeep_package_id=${id}::uuid
        union all select 1 from inventory_blocks b join jeep_departure_slots s on s.id=b.departure_slot_id where s.jeep_package_id=${id}::uuid
        union all select 1 from bundle_packages where jeep_package_id=${id}::uuid
      ) as exists
    `))[0];
    if (history?.exists) {
      await tx.execute(sql`update jeep_packages set is_active=false,updated_at=now() where id=${id}::uuid`);
      await tx.execute(sql`update jeep_departure_slots set is_active=false,updated_at=now() where jeep_package_id=${id}::uuid`);
      return { id, disposition: "ARCHIVED" };
    }
    await tx.execute(sql`delete from jeep_departure_slots where jeep_package_id=${id}::uuid`);
    await tx.execute(sql`delete from jeep_packages where id=${id}::uuid`);
    return { id, disposition: "DELETED" };
  });
}

export type AdminProductInput = {
  name: string;
  description: string;
  price: number;
  capacity: number;
  kind?: "GLAMPING" | "HOMESTAY";
  isActive?: boolean;
};

function catalogSlug(name: string) {
  const normalized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  if (!normalized)
    throw new DomainError("VALIDATION_ERROR", "Name must produce a valid slug.", 400);
  return normalized;
}

function inventoryCode(value: string) {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "-");
  if (!/^[A-Z0-9][A-Z0-9-]{1,39}$/.test(normalized))
    throw new DomainError(
      "VALIDATION_ERROR",
      "Code must contain 2-40 letters, numbers, or hyphens.",
      400,
    );
  return normalized;
}

export async function createAdminProduct(
  kind: "glamping" | "jeep",
  input: AdminProductInput,
  database: BookingDatabase = getDb(),
) {
  if (input.price <= 0 || input.capacity <= 0)
    throw new DomainError("VALIDATION_ERROR", "Price and capacity must be positive.", 400);
  return database.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`catalog:${kind}`}))`);
    const base = catalogSlug(input.name);
    const existing = rows<{ slug: string }>(await tx.execute(
      kind === "glamping"
        ? sql`select slug from accommodation_types where slug like ${`${base}%`}`
        : sql`select slug from jeep_packages where slug like ${`${base}%`}`,
    ));
    const used = new Set(existing.map((item) => item.slug));
    let slug = base;
    for (let suffix = 2; used.has(slug); suffix += 1) slug = `${base}-${suffix}`;
    const created = rows<Record<string, unknown>>(await tx.execute(
      kind === "glamping"
        ? sql`insert into accommodation_types(business_id,slug,name,kind,description,base_price,capacity_per_unit,is_active,sort_order) select id,${slug},${input.name.trim()},${input.kind ?? "GLAMPING"},${input.description.trim()},${input.price},${input.capacity},${input.isActive ?? true},coalesce((select max(sort_order)+1 from accommodation_types),0) from businesses where slug='glamping' returning id,slug,name,kind,description,base_price::int as price,capacity_per_unit as capacity,is_active as "isActive"`
        : sql`insert into jeep_packages(business_id,slug,name,description,price_per_unit,capacity_per_unit,is_active,sort_order) select id,${slug},${input.name.trim()},${input.description.trim()},${input.price},${input.capacity},${input.isActive ?? true},coalesce((select max(sort_order)+1 from jeep_packages),0) from businesses where slug='jeep' returning id,slug,name,description,price_per_unit::int as price,capacity_per_unit as capacity,is_active as "isActive"`,
    ));
    if (!created[0]) throw new DomainError("BUSINESS_NOT_FOUND", "Business was not found.", 404);
    return created[0];
  });
}

export type AdminUnitInput = { code: string; name: string; isActive?: boolean };

export async function listAdminAccommodationUnits(
  accommodationTypeId: string | null = null,
  database: BookingDatabase = getDb(),
) {
  return rows<Record<string, unknown>>(await database.execute(sql`
    select u.id,u.accommodation_type_id as "accommodationTypeId",t.name as "productName",u.code,u.name,u.is_active as "isActive",
      exists(select 1 from accommodation_unit_reservations r where r.accommodation_unit_id=u.id and r.state in ('HELD','CONFIRMED','IN_USE') and r.check_out_date>(now() at time zone 'Asia/Jakarta')::date) as "hasActiveReservation"
    from accommodation_units u join accommodation_types t on t.id=u.accommodation_type_id
    where (${accommodationTypeId}::uuid is null or u.accommodation_type_id=${accommodationTypeId}::uuid)
    order by t.sort_order,u.code
  `));
}

export async function createAdminAccommodationUnit(
  accommodationTypeId: string,
  input: AdminUnitInput,
  database: BookingDatabase = getDb(),
) {
  const code = inventoryCode(input.code);
  return database.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`accommodation-unit:${accommodationTypeId}`}))`);
    const duplicate = rows<{ exists: boolean }>(await tx.execute(sql`select exists(select 1 from accommodation_units where accommodation_type_id=${accommodationTypeId}::uuid and code=${code}) exists`))[0];
    if (duplicate?.exists) throw new DomainError("DUPLICATE_CODE", "Unit code already exists for this accommodation type.", 409);
    const created = rows<Record<string, unknown>>(await tx.execute(sql`insert into accommodation_units(accommodation_type_id,code,name,is_active) select id,${code},${input.name.trim()},${input.isActive ?? true} from accommodation_types where id=${accommodationTypeId}::uuid returning id,accommodation_type_id as "accommodationTypeId",code,name,is_active as "isActive"`));
    if (!created[0]) throw new DomainError("PRODUCT_NOT_FOUND", "Accommodation type was not found.", 404);
    return created[0];
  });
}

export async function updateAdminAccommodationUnit(
  id: string,
  input: Partial<AdminUnitInput>,
  database: BookingDatabase = getDb(),
) {
  return database.transaction(async (tx) => {
    const current = rows<{ accommodationTypeId: string; code: string; isActive: boolean }>(await tx.execute(sql`select accommodation_type_id as "accommodationTypeId",code,is_active as "isActive" from accommodation_units where id=${id}::uuid for update`))[0];
    if (!current) throw new DomainError("PRODUCT_NOT_FOUND", "Accommodation unit was not found.", 404);
    if (input.isActive === false && current.isActive) {
      const conflict = rows<{ exists: boolean }>(await tx.execute(sql`select exists(select 1 from accommodation_unit_reservations where accommodation_unit_id=${id}::uuid and state in ('HELD','CONFIRMED','IN_USE') and check_out_date>(now() at time zone 'Asia/Jakarta')::date) exists`))[0];
      if (conflict?.exists) throw new DomainError("INVENTORY_IN_USE", "Unit has an active or future reservation and cannot be deactivated.", 409);
    }
    const code = input.code === undefined ? null : inventoryCode(input.code);
    if (code && code !== current.code) {
      const duplicate = rows<{ exists: boolean }>(await tx.execute(sql`select exists(select 1 from accommodation_units where accommodation_type_id=${current.accommodationTypeId}::uuid and code=${code} and id<>${id}::uuid) exists`))[0];
      if (duplicate?.exists) throw new DomainError("DUPLICATE_CODE", "Unit code already exists for this accommodation type.", 409);
    }
    return rows<Record<string, unknown>>(await tx.execute(sql`update accommodation_units set code=coalesce(${code},code),name=coalesce(${input.name?.trim() ?? null},name),is_active=coalesce(${input.isActive ?? null},is_active),updated_at=now() where id=${id}::uuid returning id,accommodation_type_id as "accommodationTypeId",code,name,is_active as "isActive"`))[0]!;
  });
}

export async function removeAdminAccommodationUnit(id: string, database: BookingDatabase = getDb()): Promise<CatalogRemovalResult> {
  return database.transaction(async (tx) => {
    const current = rows<{ id: string }>(await tx.execute(sql`select id from accommodation_units where id=${id}::uuid for update`))[0];
    if (!current) throw new DomainError("PRODUCT_NOT_FOUND", "Accommodation unit was not found.", 404);
    const history = rows<{ exists: boolean }>(await tx.execute(sql`select exists(select 1 from accommodation_unit_reservations where accommodation_unit_id=${id}::uuid union all select 1 from inventory_blocks where accommodation_unit_id=${id}::uuid) exists`))[0];
    if (history?.exists) {
      await tx.execute(sql`update accommodation_units set is_active=false,updated_at=now() where id=${id}::uuid`);
      return { id, disposition: "ARCHIVED" };
    }
    await tx.execute(sql`delete from accommodation_units where id=${id}::uuid`);
    return { id, disposition: "DELETED" };
  });
}

export async function listAdminJeepUnits(database: BookingDatabase = getDb()) {
  return rows<Record<string, unknown>>(await database.execute(sql`
    select u.id,u.code,u.name,u.is_demo_inventory as "isDemoInventory",u.is_active as "isActive",
      exists(select 1 from jeep_unit_reservations r where r.jeep_unit_id=u.id and r.state in ('HELD','CONFIRMED','IN_USE') and r.tour_date>=(now() at time zone 'Asia/Jakarta')::date) as "hasActiveReservation"
    from jeep_units u join businesses b on b.id=u.business_id where b.slug='jeep' order by u.code
  `));
}

export async function createAdminJeepUnit(input: AdminUnitInput, database: BookingDatabase = getDb()) {
  const code = inventoryCode(input.code);
  return database.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('jeep-unit'))`);
    const duplicate = rows<{ exists: boolean }>(await tx.execute(sql`select exists(select 1 from jeep_units u join businesses b on b.id=u.business_id where b.slug='jeep' and u.code=${code}) exists`))[0];
    if (duplicate?.exists) throw new DomainError("DUPLICATE_CODE", "Jeep code already exists.", 409);
    return rows<Record<string, unknown>>(await tx.execute(sql`insert into jeep_units(business_id,code,name,is_active) select id,${code},${input.name.trim()},${input.isActive ?? true} from businesses where slug='jeep' returning id,code,name,is_active as "isActive"`))[0]!;
  });
}

export async function updateAdminJeepUnit(id: string, input: Partial<AdminUnitInput>, database: BookingDatabase = getDb()) {
  return database.transaction(async (tx) => {
    const current = rows<{ businessId: string; code: string; isActive: boolean }>(await tx.execute(sql`select business_id as "businessId",code,is_active as "isActive" from jeep_units where id=${id}::uuid for update`))[0];
    if (!current) throw new DomainError("PRODUCT_NOT_FOUND", "Jeep unit was not found.", 404);
    if (input.isActive === false && current.isActive) {
      const conflict = rows<{ exists: boolean }>(await tx.execute(sql`select exists(select 1 from jeep_unit_reservations where jeep_unit_id=${id}::uuid and state in ('HELD','CONFIRMED','IN_USE') and tour_date>=(now() at time zone 'Asia/Jakarta')::date) exists`))[0];
      if (conflict?.exists) throw new DomainError("INVENTORY_IN_USE", "Jeep has an active or future reservation and cannot be deactivated.", 409);
    }
    const code = input.code === undefined ? null : inventoryCode(input.code);
    if (code && code !== current.code) {
      const duplicate = rows<{ exists: boolean }>(await tx.execute(sql`select exists(select 1 from jeep_units where business_id=${current.businessId}::uuid and code=${code} and id<>${id}::uuid) exists`))[0];
      if (duplicate?.exists) throw new DomainError("DUPLICATE_CODE", "Jeep code already exists.", 409);
    }
    return rows<Record<string, unknown>>(await tx.execute(sql`update jeep_units set code=coalesce(${code},code),name=coalesce(${input.name?.trim() ?? null},name),is_active=coalesce(${input.isActive ?? null},is_active),updated_at=now() where id=${id}::uuid returning id,code,name,is_active as "isActive"`))[0]!;
  });
}

export async function removeAdminJeepUnit(id: string, database: BookingDatabase = getDb()): Promise<CatalogRemovalResult> {
  return database.transaction(async (tx) => {
    const current = rows<{ id: string }>(await tx.execute(sql`select id from jeep_units where id=${id}::uuid for update`))[0];
    if (!current) throw new DomainError("PRODUCT_NOT_FOUND", "Jeep unit was not found.", 404);
    const history = rows<{ exists: boolean }>(await tx.execute(sql`select exists(select 1 from jeep_unit_reservations where jeep_unit_id=${id}::uuid union all select 1 from inventory_blocks where jeep_unit_id=${id}::uuid) exists`))[0];
    if (history?.exists) {
      await tx.execute(sql`update jeep_units set is_active=false,updated_at=now() where id=${id}::uuid`);
      return { id, disposition: "ARCHIVED" };
    }
    await tx.execute(sql`delete from jeep_units where id=${id}::uuid`);
    return { id, disposition: "DELETED" };
  });
}

export type AdminSlotInput = { name: string; departureTime: string | null; isActive?: boolean };

export async function listAdminDepartureSlots(jeepPackageId: string | null = null, database: BookingDatabase = getDb()) {
  return rows<Record<string, unknown>>(await database.execute(sql`select s.id,s.jeep_package_id as "jeepPackageId",p.name as "packageName",s.name,s.departure_time::text as "departureTime",s.is_active as "isActive" from jeep_departure_slots s left join jeep_packages p on p.id=s.jeep_package_id where (${jeepPackageId}::uuid is null or s.jeep_package_id=${jeepPackageId}::uuid) order by p.sort_order,s.departure_time`));
}

export async function createAdminDepartureSlot(jeepPackageId: string, input: AdminSlotInput, database: BookingDatabase = getDb()) {
  const created = rows<Record<string, unknown>>(await database.execute(sql`insert into jeep_departure_slots(business_id,jeep_package_id,name,departure_time,is_active) select business_id,id,${input.name.trim()},${input.departureTime}::time,${input.isActive ?? true} from jeep_packages where id=${jeepPackageId}::uuid returning id,jeep_package_id as "jeepPackageId",name,departure_time::text as "departureTime",is_active as "isActive"`));
  if (!created[0]) throw new DomainError("PRODUCT_NOT_FOUND", "Jeep package was not found.", 404);
  return created[0];
}


export async function removeAdminDepartureSlot(id: string, database: BookingDatabase = getDb()): Promise<CatalogRemovalResult> {
  return database.transaction(async (tx) => {
    const current = rows<{ id: string }>(await tx.execute(sql`select id from jeep_departure_slots where id=${id}::uuid for update`))[0];
    if (!current) throw new DomainError("PRODUCT_NOT_FOUND", "Departure slot was not found.", 404);
    const history = rows<{ exists: boolean }>(await tx.execute(sql`select exists(select 1 from jeep_booking_details where departure_slot_id=${id}::uuid union all select 1 from jeep_unit_reservations where departure_slot_id=${id}::uuid union all select 1 from inventory_blocks where departure_slot_id=${id}::uuid) exists`))[0];
    if (history?.exists) {
      await tx.execute(sql`update jeep_departure_slots set is_active=false,updated_at=now() where id=${id}::uuid`);
      return { id, disposition: "ARCHIVED" };
    }
    await tx.execute(sql`delete from jeep_departure_slots where id=${id}::uuid`);
    return { id, disposition: "DELETED" };
  });
}

export async function updateAdminDepartureSlot(id: string, input: Partial<AdminSlotInput>, database: BookingDatabase = getDb()) {
  return database.transaction(async (tx) => {
    const current = rows<{ isActive: boolean }>(await tx.execute(sql`select is_active as "isActive" from jeep_departure_slots where id=${id}::uuid for update`))[0];
    if (!current) throw new DomainError("PRODUCT_NOT_FOUND", "Departure slot was not found.", 404);
    if (input.isActive === false && current.isActive) {
      const conflict = rows<{ exists: boolean }>(await tx.execute(sql`select exists(select 1 from jeep_unit_reservations where departure_slot_id=${id}::uuid and state in ('HELD','CONFIRMED','IN_USE') and tour_date>=(now() at time zone 'Asia/Jakarta')::date) exists`))[0];
      if (conflict?.exists) throw new DomainError("INVENTORY_IN_USE", "Departure slot has an active or future reservation and cannot be deactivated.", 409);
    }
    const updateDepartureTime = Object.prototype.hasOwnProperty.call(input, "departureTime");
    return rows<Record<string, unknown>>(await tx.execute(sql`update jeep_departure_slots set name=coalesce(${input.name?.trim() ?? null},name),departure_time=case when ${updateDepartureTime} then ${input.departureTime ?? null}::time else departure_time end,is_active=coalesce(${input.isActive ?? null},is_active),updated_at=now() where id=${id}::uuid returning id,jeep_package_id as "jeepPackageId",name,departure_time::text as "departureTime",is_active as "isActive"`))[0]!;
  });
}
export async function updateAdminSettings(
  id: string,
  input: {
    dpPercentage?: number;
    bookingHoldMinutes?: number;
    contactEmail?: string;
    contactPhone?: string;
  },
  database: BookingDatabase = getDb(),
) {
  if (input.dpPercentage !== undefined && (input.dpPercentage < 50 || input.dpPercentage > 100))
    throw new DomainError("VALIDATION_ERROR", "DP percentage must be between 50 and 100.", 400);
  if (input.bookingHoldMinutes !== undefined && (input.bookingHoldMinutes < 1 || input.bookingHoldMinutes > 720))
    throw new DomainError("VALIDATION_ERROR", "Payment deadline cannot exceed 12 hours.", 400);
  const result = rows<Record<string, unknown>>(
    await database.execute(
      sql`update business_settings set dp_percentage=coalesce(${input.dpPercentage ?? null},dp_percentage),booking_hold_minutes=coalesce(${input.bookingHoldMinutes ?? null},booking_hold_minutes),contact_email=coalesce(${input.contactEmail ?? null},contact_email),contact_phone=coalesce(${input.contactPhone ?? null},contact_phone),updated_at=now() where id=${id}::uuid returning id,dp_percentage as "dpPercentage",booking_hold_minutes as "bookingHoldMinutes"`,
    ),
  );
  if (!result[0])
    throw new DomainError(
      "BUSINESS_NOT_FOUND",
      "Business settings were not found.",
      404,
    );
  return result[0];
}
