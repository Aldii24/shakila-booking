import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};
const money = (name: string) => bigint(name, { mode: "number" });

export const businessTypeEnum = pgEnum("business_type", ["ACCOMMODATION", "ACTIVITY"]);
export const accommodationKindEnum = pgEnum("accommodation_kind", ["GLAMPING", "HOMESTAY"]);
export const bookingTypeEnum = pgEnum("booking_type", ["ACCOMMODATION", "JEEP", "BUNDLE"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING", "WAITING_PAYMENT", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "COMPLETED", "CANCELLED", "EXPIRED",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "UNPAID", "PENDING", "PARTIALLY_PAID", "PAID", "FAILED", "EXPIRED", "REFUNDED",
]);
export const reservationStateEnum = pgEnum("reservation_state", ["HELD", "CONFIRMED", "IN_USE", "RELEASED"]);
export const inventoryResourceTypeEnum = pgEnum("inventory_resource_type", ["ACCOMMODATION_UNIT", "JEEP_UNIT"]);
export const paymentAttemptStatusEnum = pgEnum("payment_attempt_status", [
  "CREATED", "PENDING", "SUCCESS", "FAILED", "EXPIRED", "CANCELLED", "EXCEPTION",
]);
export const paymentProofStatusEnum = pgEnum("payment_proof_status", [
  "PENDING", "APPROVED", "REJECTED",
]);
export const bookingSourceEnum = pgEnum("booking_source", [
  "ONLINE", "ADMIN_MANUAL", "WALK_IN",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["PENDING", "GENERATED", "FAILED"]);
export const bookingEventTypeEnum = pgEnum("booking_event_type", [
  "BOOKING_CREATED", "PAYMENT_CREATED", "PAYMENT_FAILED", "PAYMENT_VERIFIED", "PAYMENT_EXCEPTION",
  "BOOKING_CONFIRMED", "BOOKING_EXPIRED", "BOOKING_CANCELLED", "INVOICE_GENERATED", "INVOICE_FAILED",
  "EMAIL_SENT", "EMAIL_FAILED", "CHECKED_IN", "CHECKED_OUT", "BOOKING_COMPLETED", "INVENTORY_BLOCKED", "INVENTORY_UNBLOCKED",
  "PAYMENT_PROOF_SUBMITTED", "PAYMENT_PROOF_APPROVED", "PAYMENT_PROOF_REJECTED", "MANUAL_BOOKING_CREATED",
]);
export const eventActorTypeEnum = pgEnum("event_actor_type", [
  "SYSTEM", "CUSTOMER", "ADMIN", "PAYMENT_PROVIDER", "BACKGROUND_JOB",
]);

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 3 }).notNull().unique(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  type: businessTypeEnum("type").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  email: varchar("email", { length: 254 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  address: text("address").notNull(),
  timezone: varchar("timezone", { length: 64 }).notNull().default("Asia/Jakarta"),
  currency: varchar("currency", { length: 3 }).notNull().default("IDR"),
  ...timestamps,
});

export const businessSettings = pgTable("business_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  dpPercentage: integer("dp_percentage").notNull().default(50),
  bookingHoldMinutes: integer("booking_hold_minutes").notNull().default(720),
  defaultCheckInTime: time("default_check_in_time"),
  defaultCheckOutTime: time("default_check_out_time"),
  contactEmail: varchar("contact_email", { length: 254 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 32 }).notNull(),
  ...timestamps,
}, (table) => [
  unique("business_settings_business_id_unique").on(table.businessId),
  check("business_settings_dp_check", sql`${table.dpPercentage} between 50 and 100`),
  check("business_settings_hold_check", sql`${table.bookingHoldMinutes} > 0`),
]);

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: varchar("full_name", { length: 120 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  emailNormalized: varchar("email_normalized", { length: 254 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 32 }).notNull(),
  whatsappNormalized: varchar("whatsapp_normalized", { length: 24 }).notNull(),
  ...timestamps,
}, (table) => [index("customers_email_normalized_idx").on(table.emailNormalized), index("customers_whatsapp_normalized_idx").on(table.whatsappNormalized)]);

export const accommodationTypes = pgTable("accommodation_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  slug: varchar("slug", { length: 100 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  kind: accommodationKindEnum("kind").notNull().default("GLAMPING"),
  description: text("description").notNull(),
  basePrice: money("base_price").notNull(),
  capacityPerUnit: integer("capacity_per_unit").notNull(),
  breakfastIncludedPax: integer("breakfast_included_pax"),
  facilities: jsonb("facilities").notNull().default(sql`'[]'::jsonb`),
  mediaKey: varchar("media_key", { length: 255 }),
  isDemoData: boolean("is_demo_data").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
}, (table) => [
  unique("accommodation_types_business_slug_unique").on(table.businessId, table.slug),
  index("accommodation_types_business_idx").on(table.businessId),
  check("accommodation_types_price_check", sql`${table.basePrice} >= 0`),
  check("accommodation_types_capacity_check", sql`${table.capacityPerUnit} > 0`),
  check("accommodation_types_breakfast_check", sql`${table.breakfastIncludedPax} is null or ${table.breakfastIncludedPax} > 0`),
]);

export const accommodationUnits = pgTable("accommodation_units", {
  id: uuid("id").primaryKey().defaultRandom(),
  accommodationTypeId: uuid("accommodation_type_id").notNull().references(() => accommodationTypes.id),
  code: varchar("code", { length: 40 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
}, (table) => [unique("accommodation_units_type_code_unique").on(table.accommodationTypeId, table.code), index("accommodation_units_type_idx").on(table.accommodationTypeId)]);

export const jeepPackages = pgTable("jeep_packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  slug: varchar("slug", { length: 100 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description").notNull(),
  pricePerUnit: money("price_per_unit").notNull(),
  capacityPerUnit: integer("capacity_per_unit").notNull(),
  routes: jsonb("routes").notNull().default(sql`'[]'::jsonb`),
  facilities: jsonb("facilities").notNull().default(sql`'[]'::jsonb`),
  mediaKey: varchar("media_key", { length: 255 }),
  isDemoData: boolean("is_demo_data").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
}, (table) => [
  unique("jeep_packages_business_slug_unique").on(table.businessId, table.slug),
  index("jeep_packages_business_idx").on(table.businessId),
  check("jeep_packages_price_check", sql`${table.pricePerUnit} >= 0`),
  check("jeep_packages_capacity_check", sql`${table.capacityPerUnit} > 0`),
]);

export const jeepDepartureSlots = pgTable("jeep_departure_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  jeepPackageId: uuid("jeep_package_id").references(() => jeepPackages.id),
  name: varchar("name", { length: 80 }).notNull(),
  departureTime: time("departure_time"),
  isDemoData: boolean("is_demo_data").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
}, (table) => [index("jeep_departure_slots_package_idx").on(table.jeepPackageId)]);

export const jeepUnits = pgTable("jeep_units", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  code: varchar("code", { length: 40 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  isDemoInventory: boolean("is_demo_inventory").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
}, (table) => [unique("jeep_units_business_code_unique").on(table.businessId, table.code), index("jeep_units_business_idx").on(table.businessId)]);

export const bundlePackages = pgTable("bundle_packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  slug: varchar("slug", { length: 120 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description").notNull(),
  accommodationTypeId: uuid("accommodation_type_id").notNull().references(() => accommodationTypes.id),
  jeepPackageId: uuid("jeep_package_id").notNull().references(() => jeepPackages.id),
  accommodationQuantity: integer("accommodation_quantity").notNull().default(1),
  jeepQuantity: integer("jeep_quantity").notNull().default(1),
  nightCount: integer("night_count").notNull().default(1),
  pricePerPackage: money("price_per_package").notNull(),
  capacityPerPackage: integer("capacity_per_package").notNull(),
  routes: jsonb("routes").notNull().default(sql`'[]'::jsonb`),
  inclusions: jsonb("inclusions").notNull().default(sql`'[]'::jsonb`),
  conditions: jsonb("conditions").notNull().default(sql`'[]'::jsonb`),
  weekendSurcharge: money("weekend_surcharge").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
}, (table) => [
  unique("bundle_packages_business_slug_unique").on(table.businessId, table.slug),
  index("bundle_packages_business_idx").on(table.businessId),
  check("bundle_packages_resource_quantity_check", sql`${table.accommodationQuantity} > 0 and ${table.jeepQuantity} > 0`),
  check("bundle_packages_night_count_check", sql`${table.nightCount} > 0`),
  check("bundle_packages_price_check", sql`${table.pricePerPackage} >= 0 and ${table.weekendSurcharge} >= 0`),
  check("bundle_packages_capacity_check", sql`${table.capacityPerPackage} > 0`),
]);

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingCode: varchar("booking_code", { length: 40 }).notNull().unique(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  customerId: uuid("customer_id").references(() => customers.id),
  bookingType: bookingTypeEnum("booking_type").notNull(),
  bookingSource: bookingSourceEnum("booking_source").notNull().default("ONLINE"),
  status: bookingStatusEnum("status").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").notNull(),
  customerName: varchar("customer_name", { length: 120 }).notNull(),
  customerEmail: varchar("customer_email", { length: 254 }).notNull(),
  customerWhatsapp: varchar("customer_whatsapp", { length: 32 }).notNull(),
  customerEmailNormalized: varchar("customer_email_normalized", { length: 254 }).notNull(),
  customerWhatsappNormalized: varchar("customer_whatsapp_normalized", { length: 24 }).notNull(),
  guestCount: integer("guest_count").notNull(),
  quantity: integer("quantity").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("IDR"),
  subtotalAmount: money("subtotal_amount").notNull(),
  additionalAmount: money("additional_amount").notNull().default(0),
  totalAmount: money("total_amount").notNull(),
  dpPercentage: integer("dp_percentage").notNull(),
  requiredDpAmount: money("required_dp_amount").notNull(),
  verifiedPaidAmount: money("verified_paid_amount").notNull().default(0),
  remainingAmount: money("remaining_amount").notNull(),
  specialRequest: text("special_request"),
  adminNotes: text("admin_notes"),
  createdByAdminEmail: varchar("created_by_admin_email", { length: 254 }),
  clientIdempotencyKey: uuid("client_idempotency_key"),
  idempotencyFingerprint: varchar("idempotency_fingerprint", { length: 64 }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  checkedOutAt: timestamp("checked_out_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  requiresReview: boolean("requires_review").notNull().default(false),
  ...timestamps,
}, (table) => [
  uniqueIndex("bookings_client_idempotency_key_unique").on(table.clientIdempotencyKey).where(sql`${table.clientIdempotencyKey} is not null`),
  index("bookings_business_idx").on(table.businessId), index("bookings_customer_idx").on(table.customerId),
  index("bookings_status_idx").on(table.status), index("bookings_payment_status_idx").on(table.paymentStatus),
  index("bookings_created_at_idx").on(table.createdAt), index("bookings_business_status_idx").on(table.businessId, table.status),
  index("bookings_status_expires_idx").on(table.status, table.expiresAt),
  check("bookings_quantity_check", sql`${table.quantity} >= 1`), check("bookings_guest_count_check", sql`${table.guestCount} >= 1`),
  check("bookings_amounts_check", sql`${table.subtotalAmount} >= 0 and ${table.additionalAmount} >= 0 and ${table.totalAmount} >= 0 and ${table.requiredDpAmount} >= 0 and ${table.verifiedPaidAmount} >= 0 and ${table.remainingAmount} >= 0`),
  check("bookings_dp_check", sql`${table.dpPercentage} between 0 and 100`),
]);

export const glampingBookingDetails = pgTable("glamping_booking_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id).unique(),
  accommodationTypeId: uuid("accommodation_type_id").notNull().references(() => accommodationTypes.id),
  checkInDate: date("check_in_date", { mode: "string" }).notNull(),
  checkOutDate: date("check_out_date", { mode: "string" }).notNull(),
  nightCount: integer("night_count").notNull(),
  productNameSnapshot: varchar("product_name_snapshot", { length: 160 }).notNull(),
  unitPriceSnapshot: money("unit_price_snapshot").notNull(),
  capacitySnapshot: integer("capacity_snapshot").notNull(),
  ...timestamps,
}, (table) => [
  index("glamping_details_type_idx").on(table.accommodationTypeId), index("glamping_details_check_in_idx").on(table.checkInDate), index("glamping_details_check_out_idx").on(table.checkOutDate),
  check("glamping_details_date_check", sql`${table.checkOutDate} > ${table.checkInDate}`), check("glamping_details_nights_check", sql`${table.nightCount} >= 1`),
]);

export const jeepBookingDetails = pgTable("jeep_booking_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id).unique(),
  jeepPackageId: uuid("jeep_package_id").notNull().references(() => jeepPackages.id),
  departureSlotId: uuid("departure_slot_id").notNull().references(() => jeepDepartureSlots.id),
  tourDate: date("tour_date", { mode: "string" }).notNull(),
  packageNameSnapshot: varchar("package_name_snapshot", { length: 160 }).notNull(),
  unitPriceSnapshot: money("unit_price_snapshot").notNull(),
  capacitySnapshot: integer("capacity_snapshot").notNull(),
  departureTimeSnapshot: time("departure_time_snapshot"),
  ...timestamps,
}, (table) => [index("jeep_details_date_idx").on(table.tourDate), index("jeep_details_slot_idx").on(table.departureSlotId), index("jeep_details_package_idx").on(table.jeepPackageId)]);

export const bundleBookingDetails = pgTable("bundle_booking_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id).unique(),
  bundlePackageId: uuid("bundle_package_id").notNull().references(() => bundlePackages.id),
  checkInDate: date("check_in_date", { mode: "string" }).notNull(),
  checkOutDate: date("check_out_date", { mode: "string" }).notNull(),
  tourDate: date("tour_date", { mode: "string" }).notNull(),
  productNameSnapshot: varchar("product_name_snapshot", { length: 180 }).notNull(),
  unitPriceSnapshot: money("unit_price_snapshot").notNull(),
  capacitySnapshot: integer("capacity_snapshot").notNull(),
  accommodationQuantitySnapshot: integer("accommodation_quantity_snapshot").notNull(),
  jeepQuantitySnapshot: integer("jeep_quantity_snapshot").notNull(),
  routesSnapshot: jsonb("routes_snapshot").notNull().default(sql`'[]'::jsonb`),
  inclusionsSnapshot: jsonb("inclusions_snapshot").notNull().default(sql`'[]'::jsonb`),
  ...timestamps,
}, (table) => [
  index("bundle_details_package_idx").on(table.bundlePackageId),
  index("bundle_details_check_in_idx").on(table.checkInDate),
  check("bundle_details_date_check", sql`${table.checkOutDate} > ${table.checkInDate}`),
]);

export const accommodationUnitReservations = pgTable("accommodation_unit_reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id),
  accommodationUnitId: uuid("accommodation_unit_id").notNull().references(() => accommodationUnits.id),
  checkInDate: date("check_in_date", { mode: "string" }).notNull(),
  checkOutDate: date("check_out_date", { mode: "string" }).notNull(),
  state: reservationStateEnum("state").notNull(),
  releasedAt: timestamp("released_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("accommodation_reservations_booking_idx").on(table.bookingId), index("accommodation_reservations_unit_idx").on(table.accommodationUnitId), index("accommodation_reservations_state_idx").on(table.state),
  check("accommodation_reservations_date_check", sql`${table.checkOutDate} > ${table.checkInDate}`),
]);

export const jeepUnitReservations = pgTable("jeep_unit_reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id),
  jeepUnitId: uuid("jeep_unit_id").notNull().references(() => jeepUnits.id),
  departureSlotId: uuid("departure_slot_id").notNull().references(() => jeepDepartureSlots.id),
  tourDate: date("tour_date", { mode: "string" }).notNull(),
  state: reservationStateEnum("state").notNull(),
  releasedAt: timestamp("released_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("jeep_reservations_booking_idx").on(table.bookingId), index("jeep_reservations_unit_idx").on(table.jeepUnitId), index("jeep_reservations_date_idx").on(table.tourDate), index("jeep_reservations_slot_idx").on(table.departureSlotId),
  uniqueIndex("jeep_reservations_active_unique").on(table.jeepUnitId, table.tourDate, table.departureSlotId).where(sql`${table.state} in ('HELD', 'CONFIRMED', 'IN_USE')`),
]);

export const inventoryBlocks = pgTable("inventory_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  resourceType: inventoryResourceTypeEnum("resource_type").notNull(),
  accommodationUnitId: uuid("accommodation_unit_id").references(() => accommodationUnits.id),
  jeepUnitId: uuid("jeep_unit_id").references(() => jeepUnits.id),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }),
  departureSlotId: uuid("departure_slot_id").references(() => jeepDepartureSlots.id),
  reason: varchar("reason", { length: 80 }).notNull(),
  note: text("note"),
  createdByAdminId: uuid("created_by_admin_id"),
  removedAt: timestamp("removed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("inventory_blocks_business_idx").on(table.businessId), index("inventory_blocks_accommodation_idx").on(table.accommodationUnitId), index("inventory_blocks_jeep_idx").on(table.jeepUnitId),
  check("inventory_blocks_resource_check", sql`(${table.resourceType} = 'ACCOMMODATION_UNIT' and ${table.accommodationUnitId} is not null and ${table.jeepUnitId} is null and ${table.endDate} > ${table.startDate}) or (${table.resourceType} = 'JEEP_UNIT' and ${table.jeepUnitId} is not null and ${table.accommodationUnitId} is null)`),
]);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id).unique(),
  currency: varchar("currency", { length: 3 }).notNull().default("IDR"),
  expectedAmount: money("expected_amount").notNull(),
  verifiedAmount: money("verified_amount").notNull().default(0),
  status: paymentStatusEnum("status").notNull().default("UNPAID"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [index("payments_booking_idx").on(table.bookingId), index("payments_status_idx").on(table.status), check("payments_amount_check", sql`${table.expectedAmount} >= 0 and ${table.verifiedAmount} >= 0`)]);

export const paymentAttempts = pgTable("payment_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id").notNull().references(() => payments.id),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id),
  provider: varchar("provider", { length: 40 }).notNull(),
  providerOrderId: varchar("provider_order_id", { length: 160 }).notNull(),
  providerTransactionId: varchar("provider_transaction_id", { length: 160 }),
  requestedAmount: money("requested_amount").notNull(),
  verifiedAmount: money("verified_amount").notNull().default(0),
  status: paymentAttemptStatusEnum("status").notNull(),
  paymentMethod: varchar("payment_method", { length: 80 }),
  providerCreatedAt: timestamp("provider_created_at", { withTimezone: true }),
  providerPaidAt: timestamp("provider_paid_at", { withTimezone: true }),
  rawReference: text("raw_reference"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  failedAt: timestamp("failed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("payment_attempts_booking_idx").on(table.bookingId), index("payment_attempts_payment_idx").on(table.paymentId), index("payment_attempts_status_idx").on(table.status),
  unique("payment_attempts_provider_order_unique").on(table.provider, table.providerOrderId),
  uniqueIndex("payment_attempts_provider_transaction_unique").on(table.provider, table.providerTransactionId).where(sql`${table.providerTransactionId} is not null`),
  check("payment_attempts_amount_check", sql`${table.requestedAmount} >= 0 and ${table.verifiedAmount} >= 0`),
]);

export const paymentProofs = pgTable("payment_proofs", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id").notNull().references(() => payments.id),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id),
  paymentAttemptId: uuid("payment_attempt_id").references(() => paymentAttempts.id),
  status: paymentProofStatusEnum("status").notNull().default("PENDING"),
  claimedAmount: money("claimed_amount").notNull(),
  verifiedAmount: money("verified_amount").notNull().default(0),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSize: bigint("file_size", { mode: "number" }).notNull(),
  storageProvider: varchar("storage_provider", { length: 32 }).notNull().default("DATABASE"),
  storageKey: varchar("storage_key", { length: 512 }).notNull().default("legacy"),
  fileDataBase64: text("file_data_base64"),
  rejectionReason: text("rejection_reason"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedByAdminEmail: varchar("verified_by_admin_email", { length: 254 }),
  ...timestamps,
}, (table) => [
  index("payment_proofs_booking_idx").on(table.bookingId),
  index("payment_proofs_status_created_idx").on(table.status, table.createdAt),
  check("payment_proofs_amount_check", sql`${table.claimedAmount} > 0 and ${table.verifiedAmount} >= 0`),
  check("payment_proofs_file_size_check", sql`${table.fileSize} > 0 and ${table.fileSize} <= 5242880`),
]);

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id).unique(),
  invoiceNumber: varchar("invoice_number", { length: 40 }).notNull().unique(),
  status: invoiceStatusEnum("status").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("IDR"),
  totalAmount: money("total_amount").notNull(),
  paidAmount: money("paid_amount").notNull(),
  remainingAmount: money("remaining_amount").notNull(),
  r2ObjectKey: text("r2_object_key"),
  fileName: varchar("file_name", { length: 255 }),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: bigint("file_size", { mode: "number" }),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [check("invoices_amount_check", sql`${table.totalAmount} >= 0 and ${table.paidAmount} >= 0 and ${table.remainingAmount} >= 0`)]);

export const bookingEvents = pgTable("booking_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id),
  eventType: bookingEventTypeEnum("event_type").notNull(),
  actorType: eventActorTypeEnum("actor_type").notNull(),
  actorId: uuid("actor_id"),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("booking_events_booking_idx").on(table.bookingId), index("booking_events_booking_created_idx").on(table.bookingId, table.createdAt)]);

export type BookingRecord = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
