CREATE TABLE "admin_push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_email" varchar(254) NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh_key" text NOT NULL,
	"auth_key" text NOT NULL,
	"expiration_at" timestamp with time zone,
	"user_agent" varchar(512),
	"last_success_at" timestamp with time zone,
	"last_failure_at" timestamp with time zone,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_events" ALTER COLUMN "event_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."booking_event_type";--> statement-breakpoint
CREATE TYPE "public"."booking_event_type" AS ENUM('BOOKING_CREATED', 'PAYMENT_CREATED', 'PAYMENT_FAILED', 'PAYMENT_VERIFIED', 'PAYMENT_EXCEPTION', 'BOOKING_CONFIRMED', 'BOOKING_EXPIRED', 'BOOKING_CANCELLED', 'INVOICE_GENERATED', 'INVOICE_FAILED', 'EMAIL_SENT', 'EMAIL_FAILED', 'CHECKED_IN', 'CHECKED_OUT', 'BOOKING_COMPLETED', 'INVENTORY_BLOCKED', 'INVENTORY_UNBLOCKED', 'PAYMENT_PROOF_SUBMITTED', 'PAYMENT_PROOF_APPROVED', 'PAYMENT_PROOF_REJECTED', 'MANUAL_BOOKING_CREATED');--> statement-breakpoint
ALTER TABLE "booking_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."booking_event_type" USING "event_type"::"public"."booking_event_type";--> statement-breakpoint
CREATE UNIQUE INDEX "admin_push_subscriptions_endpoint_unique" ON "admin_push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "admin_push_subscriptions_admin_email_idx" ON "admin_push_subscriptions" USING btree ("admin_email");