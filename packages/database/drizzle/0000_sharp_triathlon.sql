CREATE EXTENSION IF NOT EXISTS "btree_gist";--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS "booking_number_seq" START WITH 1201;--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS "invoice_number_seq" START WITH 1201;--> statement-breakpoint
CREATE TYPE "public"."booking_event_type" AS ENUM('BOOKING_CREATED', 'PAYMENT_CREATED', 'PAYMENT_FAILED', 'PAYMENT_VERIFIED', 'PAYMENT_EXCEPTION', 'BOOKING_CONFIRMED', 'BOOKING_EXPIRED', 'BOOKING_CANCELLED', 'INVOICE_GENERATED', 'INVOICE_FAILED', 'EMAIL_SENT', 'EMAIL_FAILED', 'CHECKED_IN', 'CHECKED_OUT', 'INVENTORY_BLOCKED', 'INVENTORY_UNBLOCKED');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'WAITING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."booking_type" AS ENUM('ACCOMMODATION', 'JEEP');--> statement-breakpoint
CREATE TYPE "public"."business_type" AS ENUM('ACCOMMODATION', 'ACTIVITY');--> statement-breakpoint
CREATE TYPE "public"."event_actor_type" AS ENUM('SYSTEM', 'CUSTOMER', 'ADMIN', 'PAYMENT_PROVIDER', 'BACKGROUND_JOB');--> statement-breakpoint
CREATE TYPE "public"."inventory_resource_type" AS ENUM('ACCOMMODATION_UNIT', 'JEEP_UNIT');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('PENDING', 'GENERATED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."payment_attempt_status" AS ENUM('CREATED', 'PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELLED', 'EXCEPTION');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('UNPAID', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."reservation_state" AS ENUM('HELD', 'CONFIRMED', 'IN_USE', 'RELEASED');--> statement-breakpoint
CREATE TABLE "accommodation_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"base_price" bigint NOT NULL,
	"capacity_per_unit" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accommodation_types_business_slug_unique" UNIQUE("business_id","slug"),
	CONSTRAINT "accommodation_types_price_check" CHECK ("accommodation_types"."base_price" >= 0),
	CONSTRAINT "accommodation_types_capacity_check" CHECK ("accommodation_types"."capacity_per_unit" > 0)
);
--> statement-breakpoint
CREATE TABLE "accommodation_unit_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"accommodation_unit_id" uuid NOT NULL,
	"check_in_date" date NOT NULL,
	"check_out_date" date NOT NULL,
	"state" "reservation_state" NOT NULL,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accommodation_reservations_date_check" CHECK ("accommodation_unit_reservations"."check_out_date" > "accommodation_unit_reservations"."check_in_date")
);
--> statement-breakpoint
CREATE TABLE "accommodation_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accommodation_type_id" uuid NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" varchar(120) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accommodation_units_type_code_unique" UNIQUE("accommodation_type_id","code")
);
--> statement-breakpoint
CREATE TABLE "booking_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"event_type" "booking_event_type" NOT NULL,
	"actor_type" "event_actor_type" NOT NULL,
	"actor_id" uuid,
	"title" varchar(180) NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_code" varchar(40) NOT NULL,
	"business_id" uuid NOT NULL,
	"customer_id" uuid,
	"booking_type" "booking_type" NOT NULL,
	"status" "booking_status" NOT NULL,
	"payment_status" "payment_status" NOT NULL,
	"customer_name" varchar(120) NOT NULL,
	"customer_email" varchar(254) NOT NULL,
	"customer_whatsapp" varchar(32) NOT NULL,
	"customer_email_normalized" varchar(254) NOT NULL,
	"customer_whatsapp_normalized" varchar(24) NOT NULL,
	"guest_count" integer NOT NULL,
	"quantity" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'IDR' NOT NULL,
	"subtotal_amount" bigint NOT NULL,
	"additional_amount" bigint DEFAULT 0 NOT NULL,
	"total_amount" bigint NOT NULL,
	"dp_percentage" integer NOT NULL,
	"required_dp_amount" bigint NOT NULL,
	"verified_paid_amount" bigint DEFAULT 0 NOT NULL,
	"remaining_amount" bigint NOT NULL,
	"special_request" text,
	"client_idempotency_key" uuid,
	"idempotency_fingerprint" varchar(64),
	"expires_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"checked_in_at" timestamp with time zone,
	"checked_out_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"requires_review" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_booking_code_unique" UNIQUE("booking_code"),
	CONSTRAINT "bookings_quantity_check" CHECK ("bookings"."quantity" >= 1),
	CONSTRAINT "bookings_guest_count_check" CHECK ("bookings"."guest_count" >= 1),
	CONSTRAINT "bookings_amounts_check" CHECK ("bookings"."subtotal_amount" >= 0 and "bookings"."additional_amount" >= 0 and "bookings"."total_amount" >= 0 and "bookings"."required_dp_amount" >= 0 and "bookings"."verified_paid_amount" >= 0 and "bookings"."remaining_amount" >= 0),
	CONSTRAINT "bookings_dp_check" CHECK ("bookings"."dp_percentage" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "business_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"dp_percentage" integer DEFAULT 30 NOT NULL,
	"booking_hold_minutes" integer DEFAULT 30 NOT NULL,
	"default_check_in_time" time,
	"default_check_out_time" time,
	"contact_email" varchar(254) NOT NULL,
	"contact_phone" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_settings_business_id_unique" UNIQUE("business_id"),
	CONSTRAINT "business_settings_dp_check" CHECK ("business_settings"."dp_percentage" between 0 and 100),
	CONSTRAINT "business_settings_hold_check" CHECK ("business_settings"."booking_hold_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(3) NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(160) NOT NULL,
	"type" "business_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"email" varchar(254) NOT NULL,
	"phone" varchar(32) NOT NULL,
	"address" text NOT NULL,
	"timezone" varchar(64) DEFAULT 'Asia/Jakarta' NOT NULL,
	"currency" varchar(3) DEFAULT 'IDR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_code_unique" UNIQUE("code"),
	CONSTRAINT "businesses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(120) NOT NULL,
	"email" varchar(254) NOT NULL,
	"email_normalized" varchar(254) NOT NULL,
	"whatsapp" varchar(32) NOT NULL,
	"whatsapp_normalized" varchar(24) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "glamping_booking_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"accommodation_type_id" uuid NOT NULL,
	"check_in_date" date NOT NULL,
	"check_out_date" date NOT NULL,
	"night_count" integer NOT NULL,
	"product_name_snapshot" varchar(160) NOT NULL,
	"unit_price_snapshot" bigint NOT NULL,
	"capacity_snapshot" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "glamping_booking_details_booking_id_unique" UNIQUE("booking_id"),
	CONSTRAINT "glamping_details_date_check" CHECK ("glamping_booking_details"."check_out_date" > "glamping_booking_details"."check_in_date"),
	CONSTRAINT "glamping_details_nights_check" CHECK ("glamping_booking_details"."night_count" >= 1)
);
--> statement-breakpoint
CREATE TABLE "inventory_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"resource_type" "inventory_resource_type" NOT NULL,
	"accommodation_unit_id" uuid,
	"jeep_unit_id" uuid,
	"start_date" date NOT NULL,
	"end_date" date,
	"departure_slot_id" uuid,
	"reason" varchar(80) NOT NULL,
	"note" text,
	"created_by_admin_id" uuid,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_blocks_resource_check" CHECK (("inventory_blocks"."resource_type" = 'ACCOMMODATION_UNIT' and "inventory_blocks"."accommodation_unit_id" is not null and "inventory_blocks"."jeep_unit_id" is null and "inventory_blocks"."end_date" > "inventory_blocks"."start_date") or ("inventory_blocks"."resource_type" = 'JEEP_UNIT' and "inventory_blocks"."jeep_unit_id" is not null and "inventory_blocks"."accommodation_unit_id" is null))
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"invoice_number" varchar(40) NOT NULL,
	"status" "invoice_status" NOT NULL,
	"currency" varchar(3) DEFAULT 'IDR' NOT NULL,
	"total_amount" bigint NOT NULL,
	"paid_amount" bigint NOT NULL,
	"remaining_amount" bigint NOT NULL,
	"r2_object_key" text,
	"file_name" varchar(255),
	"mime_type" varchar(100),
	"file_size" bigint,
	"issued_at" timestamp with time zone NOT NULL,
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_booking_id_unique" UNIQUE("booking_id"),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "invoices_amount_check" CHECK ("invoices"."total_amount" >= 0 and "invoices"."paid_amount" >= 0 and "invoices"."remaining_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "jeep_booking_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"jeep_package_id" uuid NOT NULL,
	"departure_slot_id" uuid NOT NULL,
	"tour_date" date NOT NULL,
	"package_name_snapshot" varchar(160) NOT NULL,
	"unit_price_snapshot" bigint NOT NULL,
	"capacity_snapshot" integer NOT NULL,
	"departure_time_snapshot" time NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jeep_booking_details_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "jeep_departure_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"jeep_package_id" uuid,
	"name" varchar(80) NOT NULL,
	"departure_time" time NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jeep_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"price_per_unit" bigint NOT NULL,
	"capacity_per_unit" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jeep_packages_business_slug_unique" UNIQUE("business_id","slug"),
	CONSTRAINT "jeep_packages_price_check" CHECK ("jeep_packages"."price_per_unit" >= 0),
	CONSTRAINT "jeep_packages_capacity_check" CHECK ("jeep_packages"."capacity_per_unit" > 0)
);
--> statement-breakpoint
CREATE TABLE "jeep_unit_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"jeep_unit_id" uuid NOT NULL,
	"departure_slot_id" uuid NOT NULL,
	"tour_date" date NOT NULL,
	"state" "reservation_state" NOT NULL,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jeep_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" varchar(120) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jeep_units_business_code_unique" UNIQUE("business_id","code")
);
--> statement-breakpoint
CREATE TABLE "payment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"booking_id" uuid NOT NULL,
	"provider" varchar(40) NOT NULL,
	"provider_order_id" varchar(160) NOT NULL,
	"provider_transaction_id" varchar(160),
	"requested_amount" bigint NOT NULL,
	"verified_amount" bigint DEFAULT 0 NOT NULL,
	"status" "payment_attempt_status" NOT NULL,
	"payment_method" varchar(80),
	"provider_created_at" timestamp with time zone,
	"provider_paid_at" timestamp with time zone,
	"raw_reference" text,
	"verified_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_attempts_provider_order_unique" UNIQUE("provider","provider_order_id"),
	CONSTRAINT "payment_attempts_amount_check" CHECK ("payment_attempts"."requested_amount" >= 0 and "payment_attempts"."verified_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"currency" varchar(3) DEFAULT 'IDR' NOT NULL,
	"expected_amount" bigint NOT NULL,
	"verified_amount" bigint DEFAULT 0 NOT NULL,
	"status" "payment_status" DEFAULT 'UNPAID' NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_booking_id_unique" UNIQUE("booking_id"),
	CONSTRAINT "payments_amount_check" CHECK ("payments"."expected_amount" >= 0 and "payments"."verified_amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "accommodation_types" ADD CONSTRAINT "accommodation_types_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accommodation_unit_reservations" ADD CONSTRAINT "accommodation_unit_reservations_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accommodation_unit_reservations" ADD CONSTRAINT "accommodation_unit_reservations_accommodation_unit_id_accommodation_units_id_fk" FOREIGN KEY ("accommodation_unit_id") REFERENCES "public"."accommodation_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accommodation_units" ADD CONSTRAINT "accommodation_units_accommodation_type_id_accommodation_types_id_fk" FOREIGN KEY ("accommodation_type_id") REFERENCES "public"."accommodation_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "glamping_booking_details" ADD CONSTRAINT "glamping_booking_details_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "glamping_booking_details" ADD CONSTRAINT "glamping_booking_details_accommodation_type_id_accommodation_types_id_fk" FOREIGN KEY ("accommodation_type_id") REFERENCES "public"."accommodation_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_blocks" ADD CONSTRAINT "inventory_blocks_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_blocks" ADD CONSTRAINT "inventory_blocks_accommodation_unit_id_accommodation_units_id_fk" FOREIGN KEY ("accommodation_unit_id") REFERENCES "public"."accommodation_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_blocks" ADD CONSTRAINT "inventory_blocks_jeep_unit_id_jeep_units_id_fk" FOREIGN KEY ("jeep_unit_id") REFERENCES "public"."jeep_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_blocks" ADD CONSTRAINT "inventory_blocks_departure_slot_id_jeep_departure_slots_id_fk" FOREIGN KEY ("departure_slot_id") REFERENCES "public"."jeep_departure_slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jeep_booking_details" ADD CONSTRAINT "jeep_booking_details_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jeep_booking_details" ADD CONSTRAINT "jeep_booking_details_jeep_package_id_jeep_packages_id_fk" FOREIGN KEY ("jeep_package_id") REFERENCES "public"."jeep_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jeep_booking_details" ADD CONSTRAINT "jeep_booking_details_departure_slot_id_jeep_departure_slots_id_fk" FOREIGN KEY ("departure_slot_id") REFERENCES "public"."jeep_departure_slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jeep_departure_slots" ADD CONSTRAINT "jeep_departure_slots_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jeep_departure_slots" ADD CONSTRAINT "jeep_departure_slots_jeep_package_id_jeep_packages_id_fk" FOREIGN KEY ("jeep_package_id") REFERENCES "public"."jeep_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jeep_packages" ADD CONSTRAINT "jeep_packages_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jeep_unit_reservations" ADD CONSTRAINT "jeep_unit_reservations_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jeep_unit_reservations" ADD CONSTRAINT "jeep_unit_reservations_jeep_unit_id_jeep_units_id_fk" FOREIGN KEY ("jeep_unit_id") REFERENCES "public"."jeep_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jeep_unit_reservations" ADD CONSTRAINT "jeep_unit_reservations_departure_slot_id_jeep_departure_slots_id_fk" FOREIGN KEY ("departure_slot_id") REFERENCES "public"."jeep_departure_slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jeep_units" ADD CONSTRAINT "jeep_units_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accommodation_types_business_idx" ON "accommodation_types" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "accommodation_reservations_booking_idx" ON "accommodation_unit_reservations" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "accommodation_reservations_unit_idx" ON "accommodation_unit_reservations" USING btree ("accommodation_unit_id");--> statement-breakpoint
CREATE INDEX "accommodation_reservations_state_idx" ON "accommodation_unit_reservations" USING btree ("state");--> statement-breakpoint
CREATE INDEX "accommodation_units_type_idx" ON "accommodation_units" USING btree ("accommodation_type_id");--> statement-breakpoint
CREATE INDEX "booking_events_booking_idx" ON "booking_events" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "booking_events_booking_created_idx" ON "booking_events" USING btree ("booking_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_client_idempotency_key_unique" ON "bookings" USING btree ("client_idempotency_key") WHERE "bookings"."client_idempotency_key" is not null;--> statement-breakpoint
CREATE INDEX "bookings_business_idx" ON "bookings" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "bookings_customer_idx" ON "bookings" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_payment_status_idx" ON "bookings" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "bookings_business_status_idx" ON "bookings" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "bookings_status_expires_idx" ON "bookings" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "customers_email_normalized_idx" ON "customers" USING btree ("email_normalized");--> statement-breakpoint
CREATE INDEX "customers_whatsapp_normalized_idx" ON "customers" USING btree ("whatsapp_normalized");--> statement-breakpoint
CREATE INDEX "glamping_details_type_idx" ON "glamping_booking_details" USING btree ("accommodation_type_id");--> statement-breakpoint
CREATE INDEX "glamping_details_check_in_idx" ON "glamping_booking_details" USING btree ("check_in_date");--> statement-breakpoint
CREATE INDEX "glamping_details_check_out_idx" ON "glamping_booking_details" USING btree ("check_out_date");--> statement-breakpoint
CREATE INDEX "inventory_blocks_business_idx" ON "inventory_blocks" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "inventory_blocks_accommodation_idx" ON "inventory_blocks" USING btree ("accommodation_unit_id");--> statement-breakpoint
CREATE INDEX "inventory_blocks_jeep_idx" ON "inventory_blocks" USING btree ("jeep_unit_id");--> statement-breakpoint
CREATE INDEX "jeep_details_date_idx" ON "jeep_booking_details" USING btree ("tour_date");--> statement-breakpoint
CREATE INDEX "jeep_details_slot_idx" ON "jeep_booking_details" USING btree ("departure_slot_id");--> statement-breakpoint
CREATE INDEX "jeep_details_package_idx" ON "jeep_booking_details" USING btree ("jeep_package_id");--> statement-breakpoint
CREATE INDEX "jeep_departure_slots_package_idx" ON "jeep_departure_slots" USING btree ("jeep_package_id");--> statement-breakpoint
CREATE INDEX "jeep_packages_business_idx" ON "jeep_packages" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "jeep_reservations_booking_idx" ON "jeep_unit_reservations" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "jeep_reservations_unit_idx" ON "jeep_unit_reservations" USING btree ("jeep_unit_id");--> statement-breakpoint
CREATE INDEX "jeep_reservations_date_idx" ON "jeep_unit_reservations" USING btree ("tour_date");--> statement-breakpoint
CREATE INDEX "jeep_reservations_slot_idx" ON "jeep_unit_reservations" USING btree ("departure_slot_id");--> statement-breakpoint
CREATE UNIQUE INDEX "jeep_reservations_active_unique" ON "jeep_unit_reservations" USING btree ("jeep_unit_id","tour_date","departure_slot_id") WHERE "jeep_unit_reservations"."state" in ('HELD', 'CONFIRMED', 'IN_USE');--> statement-breakpoint
CREATE INDEX "jeep_units_business_idx" ON "jeep_units" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "payment_attempts_booking_idx" ON "payment_attempts" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payment_attempts_payment_idx" ON "payment_attempts" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payment_attempts_status_idx" ON "payment_attempts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_attempts_provider_transaction_unique" ON "payment_attempts" USING btree ("provider","provider_transaction_id") WHERE "payment_attempts"."provider_transaction_id" is not null;--> statement-breakpoint
CREATE INDEX "payments_booking_idx" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
ALTER TABLE "accommodation_unit_reservations"
ADD CONSTRAINT "accommodation_reservations_no_active_overlap"
EXCLUDE USING gist (
  "accommodation_unit_id" WITH =,
  daterange("check_in_date", "check_out_date", '[)') WITH &&
)
WHERE ("state" IN ('HELD', 'CONFIRMED', 'IN_USE'));
