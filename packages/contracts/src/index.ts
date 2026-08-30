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

export const quoteRequestSchema = z.discriminatedUnion("business", [
  glampingQuoteRequestSchema,
  jeepQuoteRequestSchema,
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
]);

export const bookingLookupRequestSchema = z.object({
  bookingCode: bookingCodeSchema,
  email: emailSchema.optional(),
  whatsapp: whatsappSchema.optional(),
  turnstileToken: z.string().min(1).optional(),
}).refine((value) => Boolean(value.email) !== Boolean(value.whatsapp), {
  message: "Provide exactly one of email or WhatsApp.",
});

export const paymentInitiationResponseSchema=z.discriminatedUnion("provider",[
  z.object({provider:z.literal("PAKASIR"),orderId:z.string(),amount:z.number().int().nonnegative(),expiresAt:z.string().nullable(),checkoutUrl:z.url()}),
  z.object({provider:z.literal("DEMO"),orderId:z.string(),amount:z.number().int().nonnegative(),expiresAt:z.string().nullable(),checkoutUrl:z.null(),demo:z.literal(true)}),
]);
export const bookingStatusResponseSchema=z.object({bookingCode:bookingCodeSchema,bookingType:z.enum(["ACCOMMODATION","JEEP"]),status:z.enum(bookingStatuses),paymentStatus:z.enum(paymentStatuses),customerName:z.string(),quantity:z.number().int(),guestCount:z.number().int(),subtotalAmount:z.number().int(),totalAmount:z.number().int(),dpPercentage:z.number().int(),requiredDpAmount:z.number().int(),verifiedPaidAmount:z.number().int(),remainingAmount:z.number().int(),expiresAt:z.coerce.string().nullable(),requiresReview:z.boolean(),bookingSource:z.enum(["ONLINE","ADMIN_MANUAL","WALK_IN"]),productName:z.string(),unitPrice:z.number().int(),nightCount:z.number().int().nullable(),startDate:z.string(),endDate:z.string().nullable(),departureTime:z.string().nullable(),invoiceStatus:z.enum(["PENDING","GENERATED","FAILED"]).nullable(),invoiceNumber:z.string().nullable(),latestProofStatus:z.enum(["PENDING","APPROVED","REJECTED"]).nullable(),latestProofRejectionReason:z.string().nullable(),latestProofCreatedAt:z.coerce.string().nullable()});

export type CreateBookingRequest = z.infer<typeof createBookingRequestSchema>;
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type BookingLookupRequest = z.infer<typeof bookingLookupRequestSchema>;

export type ApiError = { code: string; message: string; fields?: Record<string, string[]> };
export type ApiEnvelope<T> = { data: T | null; error: ApiError | null; meta: Record<string, unknown> | null };

export const successEnvelope = <T>(data: T): ApiEnvelope<T> => ({ data, error: null, meta: null });
export const errorEnvelope = (code: string, message: string): ApiEnvelope<never> => ({
  data: null, error: { code, message }, meta: null,
});
