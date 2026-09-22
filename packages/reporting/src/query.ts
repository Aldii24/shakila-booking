import { sql } from "drizzle-orm";
import type {
  AccommodationReportRow,
  AdminReport,
  AdminReportBusiness,
  AdminReportQuery,
  AdminReportSummary,
  JeepReportRow,
} from "@booking/contracts";
import { getDb, type BookingDatabase } from "@booking/database";
import { resolveReportPeriod, REPORT_TIMEZONE } from "./period";

type RawAccommodationRow = {
  bookingCode: string;
  bookingDate: string;
  accommodationKind: "GLAMPING" | "HOMESTAY" | null;
  roomType: string | null;
  guestName: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  unitQuantity: number;
  guestCount: number;
  bookingSource: string;
  bookingStatus: string;
  paymentStatus: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
};

type RawJeepRow = {
  bookingCode: string;
  bookingDate: string;
  packageName: string | null;
  customerName: string;
  tourDate: string | null;
  jeepQuantity: number;
  guestCount: number;
  bookingSource: string;
  bookingStatus: string;
  paymentStatus: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
};

type RawSummary = {
  totalBookings: number;
  totalBookingValue: number;
  verifiedRevenue: number;
  remainingAmount: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
};

const rows = <T>(value: unknown) => value as T[];

const sourceLabels: Record<string, string> = {
  ONLINE: "Online",
  ADMIN_MANUAL: "Admin manual",
  WALK_IN: "Datang langsung",
};

const bookingStatusLabels: Record<string, string> = {
  PENDING: "Menunggu proses",
  WAITING_PAYMENT: "Menunggu pembayaran",
  CONFIRMED: "Dikonfirmasi",
  CHECKED_IN: "Sudah check-in",
  CHECKED_OUT: "Sudah check-out",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  EXPIRED: "Kedaluwarsa",
};

const paymentStatusLabels: Record<string, string> = {
  UNPAID: "Belum dibayar",
  PENDING: "Menunggu",
  PARTIALLY_PAID: "DP terverifikasi",
  PAID: "Lunas",
  FAILED: "Gagal",
  EXPIRED: "Kedaluwarsa",
  REFUNDED: "Dikembalikan",
};

function label(map: Record<string, string>, value: string): string {
  return map[value] ?? value.replaceAll("_", " ");
}

function kindLabel(value: RawAccommodationRow["accommodationKind"]): string {
  return value === "HOMESTAY" ? "Homestay" : "Glamping";
}

function businessLabel(business: AdminReportBusiness): string {
  return business === "accommodation" ? "Akomodasi (Glamping + Homestay)" : "Jeep";
}

function whereClause(business: AdminReportBusiness, startDate: string, endDate: string) {
  const businessAndType =
    business === "accommodation"
      ? sql`bu.slug = ${"glamping"} and b.booking_type in ('ACCOMMODATION', 'BUNDLE') and (g.booking_id is not null or bd.booking_id is not null)`
      : sql`bu.slug = ${"jeep"} and b.booking_type = 'JEEP' and j.booking_id is not null`;
  return sql`
    where ${businessAndType}
      and (b.created_at at time zone ${REPORT_TIMEZONE})::date between ${startDate}::date and ${endDate}::date
  `;
}

function statusSummarySql() {
  return sql`
    count(*)::int as "totalBookings",
    coalesce(sum(b.total_amount), 0)::int as "totalBookingValue",
    coalesce(sum(b.verified_paid_amount) filter (
      where b.status not in ('CANCELLED', 'EXPIRED') and b.payment_status <> 'REFUNDED'
    ), 0)::int as "verifiedRevenue",
    coalesce(sum(b.remaining_amount) filter (
      where b.status not in ('CANCELLED', 'EXPIRED')
    ), 0)::int as "remainingAmount",
    count(*) filter (where b.status = 'CONFIRMED')::int as "confirmedBookings",
    count(*) filter (where b.status in ('CHECKED_OUT', 'COMPLETED'))::int as "completedBookings",
    count(*) filter (where b.status = 'CANCELLED')::int as "cancelledBookings"
  `;
}

function mapSummary(value: RawSummary | undefined): AdminReportSummary {
  return {
    totalBookings: Number(value?.totalBookings ?? 0),
    totalBookingValue: Number(value?.totalBookingValue ?? 0),
    verifiedRevenue: Number(value?.verifiedRevenue ?? 0),
    remainingAmount: Number(value?.remainingAmount ?? 0),
    confirmedBookings: Number(value?.confirmedBookings ?? 0),
    completedBookings: Number(value?.completedBookings ?? 0),
    cancelledBookings: Number(value?.cancelledBookings ?? 0),
  };
}

function mapAccommodationRow(row: RawAccommodationRow): AccommodationReportRow {
  return {
    bookingCode: row.bookingCode,
    bookingDate: row.bookingDate,
    accommodationKindLabel: kindLabel(row.accommodationKind),
    roomType: row.roomType ?? "-",
    guestName: row.guestName,
    checkInDate: row.checkInDate ?? "-",
    checkOutDate: row.checkOutDate ?? "-",
    unitQuantity: Number(row.unitQuantity),
    guestCount: Number(row.guestCount),
    bookingSourceLabel: label(sourceLabels, row.bookingSource),
    bookingStatusLabel: label(bookingStatusLabels, row.bookingStatus),
    paymentStatusLabel: label(paymentStatusLabels, row.paymentStatus),
    totalAmount: Number(row.totalAmount),
    paidAmount: Number(row.paidAmount),
    remainingAmount: Number(row.remainingAmount),
  };
}

function mapJeepRow(row: RawJeepRow): JeepReportRow {
  return {
    bookingCode: row.bookingCode,
    bookingDate: row.bookingDate,
    packageName: row.packageName ?? "-",
    customerName: row.customerName,
    tourDate: row.tourDate ?? "-",
    jeepQuantity: Number(row.jeepQuantity),
    guestCount: Number(row.guestCount),
    bookingSourceLabel: label(sourceLabels, row.bookingSource),
    bookingStatusLabel: label(bookingStatusLabels, row.bookingStatus),
    paymentStatusLabel: label(paymentStatusLabels, row.paymentStatus),
    totalAmount: Number(row.totalAmount),
    paidAmount: Number(row.paidAmount),
    remainingAmount: Number(row.remainingAmount),
  };
}

export async function getAdminReport(
  input: AdminReportQuery,
  database: BookingDatabase = getDb(),
  now = new Date(),
): Promise<AdminReport> {
  const period = resolveReportPeriod(input, now);
  const where = whereClause(input.business, period.startDate, period.endDate);

  const summaryQuery = database.execute(sql`
    select ${statusSummarySql()}
    from bookings b
      join businesses bu on bu.id = b.business_id
      left join glamping_booking_details g on g.booking_id = b.id
      left join bundle_booking_details bd on bd.booking_id = b.id
      left join jeep_booking_details j on j.booking_id = b.id
    ${where}
  `);
  const detailQuery =
    input.business === "accommodation"
      ? database.execute(sql`
          select
            b.booking_code as "bookingCode",
            (b.created_at at time zone ${REPORT_TIMEZONE})::date::text as "bookingDate",
            atype.kind as "accommodationKind",
            case when b.booking_type = 'BUNDLE'
              then coalesce(atype.name, bd.product_name_snapshot, g.product_name_snapshot)
              else coalesce(g.product_name_snapshot, atype.name, bd.product_name_snapshot)
            end as "roomType",
            b.customer_name as "guestName",
            coalesce(g.check_in_date, bd.check_in_date)::text as "checkInDate",
            coalesce(g.check_out_date, bd.check_out_date)::text as "checkOutDate",
            case when b.booking_type = 'BUNDLE'
              then b.quantity * coalesce(bd.accommodation_quantity_snapshot, 1)
              else b.quantity
            end::int as "unitQuantity",
            b.guest_count as "guestCount",
            b.booking_source as "bookingSource",
            b.status as "bookingStatus",
            b.payment_status as "paymentStatus",
            b.total_amount::int as "totalAmount",
            b.verified_paid_amount::int as "paidAmount",
            b.remaining_amount::int as "remainingAmount"
          from bookings b
            join businesses bu on bu.id = b.business_id
            left join glamping_booking_details g on g.booking_id = b.id
            left join bundle_booking_details bd on bd.booking_id = b.id
            left join bundle_packages bp on bp.id = bd.bundle_package_id
            left join accommodation_types atype on atype.id = coalesce(g.accommodation_type_id, bp.accommodation_type_id)
            left join jeep_booking_details j on j.booking_id = b.id
          ${where}
          order by b.created_at desc, b.booking_code
        `)
      : database.execute(sql`
          select
            b.booking_code as "bookingCode",
            (b.created_at at time zone ${REPORT_TIMEZONE})::date::text as "bookingDate",
            coalesce(j.package_name_snapshot, p.name) as "packageName",
            b.customer_name as "customerName",
            j.tour_date::text as "tourDate",
            b.quantity as "jeepQuantity",
            b.guest_count as "guestCount",
            b.booking_source as "bookingSource",
            b.status as "bookingStatus",
            b.payment_status as "paymentStatus",
            b.total_amount::int as "totalAmount",
            b.verified_paid_amount::int as "paidAmount",
            b.remaining_amount::int as "remainingAmount"
          from bookings b
            join businesses bu on bu.id = b.business_id
            left join jeep_booking_details j on j.booking_id = b.id
            left join jeep_packages p on p.id = j.jeep_package_id
            left join glamping_booking_details g on g.booking_id = b.id
            left join bundle_booking_details bd on bd.booking_id = b.id
          ${where}
          order by b.created_at desc, b.booking_code
        `);

  const [summaryResult, detailResult] = await Promise.all([summaryQuery, detailQuery]);
  const summary = mapSummary(rows<RawSummary>(summaryResult)[0]);
  const reportRows =
    input.business === "accommodation"
      ? rows<RawAccommodationRow>(detailResult).map(mapAccommodationRow)
      : rows<RawJeepRow>(detailResult).map(mapJeepRow);

  return {
    title: "Laporan Shakila Group",
    business: input.business,
    businessLabel: businessLabel(input.business),
    period,
    exportedAt: new Date().toISOString(),
    summary,
    rows: reportRows,
    emptyMessage: reportRows.length ? null : "Tidak ada data pada periode ini.",
  };
}
