CREATE TYPE "public"."booking_source" AS ENUM('ONLINE', 'ADMIN_MANUAL', 'WALK_IN');--> statement-breakpoint
CREATE TYPE "public"."payment_proof_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
ALTER TYPE "public"."booking_event_type" ADD VALUE 'PAYMENT_PROOF_SUBMITTED';--> statement-breakpoint
ALTER TYPE "public"."booking_event_type" ADD VALUE 'PAYMENT_PROOF_APPROVED';--> statement-breakpoint
ALTER TYPE "public"."booking_event_type" ADD VALUE 'PAYMENT_PROOF_REJECTED';--> statement-breakpoint
ALTER TYPE "public"."booking_event_type" ADD VALUE 'MANUAL_BOOKING_CREATED';--> statement-breakpoint
CREATE TABLE "payment_proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"booking_id" uuid NOT NULL,
	"payment_attempt_id" uuid,
	"status" "payment_proof_status" DEFAULT 'PENDING' NOT NULL,
	"claimed_amount" bigint NOT NULL,
	"verified_amount" bigint DEFAULT 0 NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" bigint NOT NULL,
	"file_data_base64" text NOT NULL,
	"rejection_reason" text,
	"verified_at" timestamp with time zone,
	"verified_by_admin_email" varchar(254),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_proofs_amount_check" CHECK ("payment_proofs"."claimed_amount" > 0 and "payment_proofs"."verified_amount" >= 0),
	CONSTRAINT "payment_proofs_file_size_check" CHECK ("payment_proofs"."file_size" > 0 and "payment_proofs"."file_size" <= 5242880)
);
--> statement-breakpoint
ALTER TABLE "business_settings" ALTER COLUMN "dp_percentage" SET DEFAULT 50;--> statement-breakpoint
ALTER TABLE "business_settings" ALTER COLUMN "booking_hold_minutes" SET DEFAULT 720;--> statement-breakpoint
UPDATE "business_settings" SET "dp_percentage" = greatest("dp_percentage", 50), "booking_hold_minutes" = 720, "default_check_in_time" = CASE WHEN "default_check_in_time" IS NULL THEN NULL ELSE '13:00'::time END, "default_check_out_time" = CASE WHEN "default_check_out_time" IS NULL THEN NULL ELSE '12:00'::time END, "updated_at" = now();--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "booking_source" "booking_source" DEFAULT 'ONLINE' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "admin_notes" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "created_by_admin_email" varchar(254);--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_payment_attempt_id_payment_attempts_id_fk" FOREIGN KEY ("payment_attempt_id") REFERENCES "public"."payment_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_proofs_booking_idx" ON "payment_proofs" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payment_proofs_status_created_idx" ON "payment_proofs" USING btree ("status","created_at");
