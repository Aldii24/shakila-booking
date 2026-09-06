CREATE TYPE "public"."accommodation_kind" AS ENUM('GLAMPING', 'HOMESTAY');--> statement-breakpoint
ALTER TABLE "accommodation_types" ADD COLUMN "kind" "accommodation_kind" DEFAULT 'GLAMPING' NOT NULL;--> statement-breakpoint
ALTER TABLE "accommodation_types" ADD COLUMN "breakfast_included_pax" integer;--> statement-breakpoint
ALTER TABLE "accommodation_types" ADD COLUMN "facilities" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "accommodation_types" ADD COLUMN "media_key" varchar(255);--> statement-breakpoint
ALTER TABLE "accommodation_types" ADD COLUMN "is_demo_data" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "jeep_departure_slots" ADD COLUMN "is_demo_data" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "jeep_packages" ADD COLUMN "routes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "jeep_packages" ADD COLUMN "facilities" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "jeep_packages" ADD COLUMN "media_key" varchar(255);--> statement-breakpoint
ALTER TABLE "jeep_packages" ADD COLUMN "is_demo_data" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "jeep_units" ADD COLUMN "is_demo_inventory" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "accommodation_types" ADD CONSTRAINT "accommodation_types_breakfast_check" CHECK ("accommodation_types"."breakfast_included_pax" is null or "accommodation_types"."breakfast_included_pax" > 0);