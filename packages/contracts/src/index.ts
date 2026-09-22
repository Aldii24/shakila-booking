import { z } from "zod";
import {
  bookingCodeSchema,
  emailSchema,
  localDateSchema,
  positiveIntegerSchema,
  whatsappSchema,
} from "@booking/validation";

export const bookingStatuses = [
  "PENDING", "WAITING_PAYMENT", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT",
  "COMPLETED", "CANCELLED", "EXPIRED",
] as const;
export const paymentStatuses = [
  "UNPAID", "PENDING", "PARTIALLY_PAID", "PAID", "FAILED", "EXPIRED", "REFUNDED",
] as const;

export type BookingStatus = (typeof bookingStatuses)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];

// PostgreSQL's uuid type accepts canonical UUID text regardless of RFC version
// and variant bits. Seeded deterministic IDs intentionally use that full range.
export const databaseUuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

export const customerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: emailSchema,
  whatsapp: whatsappSchema,
});

export const glampingAvailabilityRequestSchema = z.object({
  checkInDate: localDateSchema,
  checkOutDate: localDateSchema,
  guestCount: positiveIntegerSchema,
  accommodationTypeSlug: z.string().trim().min(1).optional(),
}).refine((value) => value.checkInDate < value.checkOutDate, {
  message: "Check-out date must be after check-in date.", path: ["checkOutDate"],
});

export const jeepAvailabilityRequestSchema = z.object({
  packageSlug: z.string().trim().min(1),
  tourDate: localDateSchema,
  departureSlotId: databaseUuidSchema,
  guestCount: positiveIntegerSchema,
});

export const bundleAvailabilityRequestSchema = z.object({
  bundleSlug: z.string().trim().min(1),
  checkInDate: localDateSchema,
  checkOutDate: localDateSchema,
}).refine((value) => value.checkInDate < value.checkOutDate, {
  message: "Check-out date must be after check-in date.", path: ["checkOutDate"],
});

export const availabilityCalendarRequestSchema = z.object({
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});

const glampingReservationSchema = z.object({
  productSlug: z.string().trim().min(1),
  checkInDate: localDateSchema,
  checkOutDate: localDateSchema,
  quantity: positiveIntegerSchema,
  guestCount: positiveIntegerSchema,
});

const jeepReservationSchema = z.object({
  packageSlug: z.string().trim().min(1),
  tourDate: localDateSchema,
  departureSlotId: databaseUuidSchema,
  quantity: positiveIntegerSchema,
  guestCount: positiveIntegerSchema,
});

const bundleReservationSchema = z.object({
  bundleSlug: z.string().trim().min(1),
  checkInDate: localDateSchema,
  checkOutDate: localDateSchema,
  quantity: positiveIntegerSchema,
  guestCount: positiveIntegerSchema,
}).refine((value) => value.checkInDate < value.checkOutDate, {
  message: "Check-out date must be after check-in date.", path: ["checkOutDate"],
});

export const glampingQuoteRequestSchema = z.object({
  business: z.literal("glamping"),
  productSlug: z.string().trim().min(1),
  checkInDate: localDateSchema,
  checkOutDate: localDateSchema,
  quantity: positiveIntegerSchema,
  guestCount: positiveIntegerSchema,
});

export const jeepQuoteRequestSchema = z.object({
  business: z.literal("jeep"),
  packageSlug: z.string().trim().min(1),
  tourDate: localDateSchema,
  departureSlotId: databaseUuidSchema,
  quantity: positiveIntegerSchema,
  guestCount: positiveIntegerSchema,
});

export const bundleQuoteRequestSchema = z.object({
  business: z.literal("bundle"),
  bundleSlug: z.string().trim().min(1),
  checkInDate: localDateSchema,
  checkOutDate: localDateSchema,
  quantity: positiveIntegerSchema,
  guestCount: positiveIntegerSchema,
}).refine((value) => value.checkInDate < value.checkOutDate, {
  message: "Check-out date must be after check-in date.", path: ["checkOutDate"],
});

export const quoteRequestSchema = z.discriminatedUnion("business", [
  glampingQuoteRequestSchema,
  jeepQuoteRequestSchema,
  bundleQuoteRequestSchema,
]);

export const createBookingRequestSchema = z.discriminatedUnion("business", [
  z.object({
    business: z.literal("glamping"), reservation: glampingReservationSchema,
    customer: customerSchema, specialRequest: z.string().trim().max(1000).nullable().optional(),
    turnstileToken: z.string().min(1).optional(),
  }),
  z.object({
    business: z.literal("jeep"), reservation: jeepReservationSchema,
    customer: customerSchema, specialRequest: z.string().trim().max(1000).nullable().optional(),
    turnstileToken: z.string().min(1).optional(),
  }),
  z.object({
    business: z.literal("bundle"), reservation: bundleReservationSchema,
    customer: customerSchema, specialRequest: z.string().trim().max(1000).nullable().optional(),
    turnstileToken: z.string().min(1).optional(),
  }),
]);

export const bookingLookupRequestSchema = z.object({
  bookingCode: bookingCodeSchema,
  email: emailSchema.optional(),
  whatsapp: whatsappSchema.optional(),
  turnstileToken: z.string().min(1).optional(),
}).refine((value) => Boolean(value.email) !== Boolean(value.whatsapp), {
  message: "Provide exactly one of email or WhatsApp.",
});

export const bookingStatusResponseSchema=z.object({bookingCode:bookingCodeSchema,bookingType:z.enum(["ACCOMMODATION","JEEP","BUNDLE"]),status:z.enum(bookingStatuses),paymentStatus:z.enum(paymentStatuses),customerName:z.string(),quantity:z.number().int(),guestCount:z.number().int(),subtotalAmount:z.number().int(),totalAmount:z.number().int(),dpPercentage:z.number().int(),requiredDpAmount:z.number().int(),verifiedPaidAmount:z.number().int(),remainingAmount:z.number().int(),expiresAt:z.coerce.string().nullable(),requiresReview:z.boolean(),bookingSource:z.enum(["ONLINE","ADMIN_MANUAL","WALK_IN"]),productName:z.string(),unitPrice:z.number().int(),nightCount:z.number().int().nullable(),startDate:z.string(),endDate:z.string().nullable(),departureTime:z.string().nullable(),invoiceStatus:z.enum(["PENDING","GENERATED","FAILED"]).nullable(),invoiceNumber:z.string().nullable(),latestProofStatus:z.enum(["PENDING","APPROVED","REJECTED"]).nullable(),latestProofRejectionReason:z.string().nullable(),latestProofCreatedAt:z.coerce.string().nullable()});

export type CreateBookingRequest = z.infer<typeof createBookingRequestSchema>;
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type BookingLookupRequest = z.infer<typeof bookingLookupRequestSchema>;

export type ApiError = { code: string; message: string; fields?: Record<string, string[]> };
export type ApiEnvelope<T> = { data: T | null; error: ApiError | null; meta: Record<string, unknown> | null };

export const adminReportBusinesses = ["accommodation", "jeep"] as const;
export const adminReportPeriods = ["today", "this_week", "this_month", "custom"] as const;
export const adminReportFormats = ["json", "xlsx", "pdf"] as const;
export type AdminReportBusiness = (typeof adminReportBusinesses)[number];
export type AdminReportPeriodKey = (typeof adminReportPeriods)[number];
export type AdminReportFormat = (typeof adminReportFormats)[number];

export const adminReportQuerySchema = z
  .object({
    business: z.enum(adminReportBusinesses).default("accommodation"),
    period: z.enum(adminReportPeriods).default("this_month"),
    dateFrom: z.iso.date().optional(),
    dateTo: z.iso.date().optional(),
  })
  .superRefine((value, context) => {
    if (value.period === "custom" && !value.dateFrom) {
      context.addIssue({ code: "custom", path: ["dateFrom"], message: "Tanggal awal wajib diisi." });
    }
    if (value.period === "custom" && !value.dateTo) {
      context.addIssue({ code: "custom", path: ["dateTo"], message: "Tanggal akhir wajib diisi." });
    }
    if (value.dateFrom && value.dateTo && value.dateFrom > value.dateTo) {
      context.addIssue({ code: "custom", path: ["dateTo"], message: "Tanggal akhir harus setelah tanggal awal." });
    }
  });

export const adminReportFormatSchema = z.enum(adminReportFormats);

export type AdminReportQuery = z.infer<typeof adminReportQuerySchema>;
export type AdminReportPeriod = {
  key: AdminReportPeriodKey;
  startDate: string;
  endDate: string;
  label: string;
};
export type AdminReportSummary = {
  totalBookings: number;
  totalBookingValue: number;
  verifiedRevenue: number;
  remainingAmount: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
};
export type AccommodationReportRow = {
  bookingCode: string;
  bookingDate: string;
  accommodationKindLabel: string;
  roomType: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  unitQuantity: number;
  guestCount: number;
  bookingSourceLabel: string;
  bookingStatusLabel: string;
  paymentStatusLabel: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
};
export type JeepReportRow = {
  bookingCode: string;
  bookingDate: string;
  packageName: string;
  customerName: string;
  tourDate: string;
  jeepQuantity: number;
  guestCount: number;
  bookingSourceLabel: string;
  bookingStatusLabel: string;
  paymentStatusLabel: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
};
export type AdminReport = {
  title: "Laporan Shakila Group";
  business: AdminReportBusiness;
  businessLabel: string;
  period: AdminReportPeriod;
  exportedAt: string;
  summary: AdminReportSummary;
  rows: AccommodationReportRow[] | JeepReportRow[];
  emptyMessage: string | null;
};

export const successEnvelope = <T>(data: T): ApiEnvelope<T> => ({ data, error: null, meta: null });
export const errorEnvelope = (code: string, message: string): ApiEnvelope<never> => ({
  data: null, error: { code, message }, meta: null,
});
