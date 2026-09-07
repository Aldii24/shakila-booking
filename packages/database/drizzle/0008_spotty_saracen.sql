ALTER TYPE "public"."booking_type" ADD VALUE 'BUNDLE';--> statement-breakpoint
CREATE TABLE "bundle_booking_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"bundle_package_id" uuid NOT NULL,
	"check_in_date" date NOT NULL,
	"check_out_date" date NOT NULL,
	"tour_date" date NOT NULL,
	"product_name_snapshot" varchar(180) NOT NULL,
	"unit_price_snapshot" bigint NOT NULL,
	"capacity_snapshot" integer NOT NULL,
	"accommodation_quantity_snapshot" integer NOT NULL,
	"jeep_quantity_snapshot" integer NOT NULL,
	"routes_snapshot" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"inclusions_snapshot" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bundle_booking_details_booking_id_unique" UNIQUE("booking_id"),
	CONSTRAINT "bundle_details_date_check" CHECK ("bundle_booking_details"."check_out_date" > "bundle_booking_details"."check_in_date")
);
--> statement-breakpoint
CREATE TABLE "bundle_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(180) NOT NULL,
	"description" text NOT NULL,
	"accommodation_type_id" uuid NOT NULL,
	"jeep_package_id" uuid NOT NULL,
	"accommodation_quantity" integer DEFAULT 1 NOT NULL,
	"jeep_quantity" integer DEFAULT 1 NOT NULL,
	"night_count" integer DEFAULT 1 NOT NULL,
	"price_per_package" bigint NOT NULL,
	"capacity_per_package" integer NOT NULL,
	"routes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"inclusions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"weekend_surcharge" bigint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bundle_packages_business_slug_unique" UNIQUE("business_id","slug"),
	CONSTRAINT "bundle_packages_resource_quantity_check" CHECK ("bundle_packages"."accommodation_quantity" > 0 and "bundle_packages"."jeep_quantity" > 0),
	CONSTRAINT "bundle_packages_night_count_check" CHECK ("bundle_packages"."night_count" > 0),
	CONSTRAINT "bundle_packages_price_check" CHECK ("bundle_packages"."price_per_package" >= 0 and "bundle_packages"."weekend_surcharge" >= 0),
	CONSTRAINT "bundle_packages_capacity_check" CHECK ("bundle_packages"."capacity_per_package" > 0)
);
--> statement-breakpoint
ALTER TABLE "bundle_booking_details" ADD CONSTRAINT "bundle_booking_details_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_booking_details" ADD CONSTRAINT "bundle_booking_details_bundle_package_id_bundle_packages_id_fk" FOREIGN KEY ("bundle_package_id") REFERENCES "public"."bundle_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_packages" ADD CONSTRAINT "bundle_packages_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_packages" ADD CONSTRAINT "bundle_packages_accommodation_type_id_accommodation_types_id_fk" FOREIGN KEY ("accommodation_type_id") REFERENCES "public"."accommodation_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_packages" ADD CONSTRAINT "bundle_packages_jeep_package_id_jeep_packages_id_fk" FOREIGN KEY ("jeep_package_id") REFERENCES "public"."jeep_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bundle_details_package_idx" ON "bundle_booking_details" USING btree ("bundle_package_id");--> statement-breakpoint
CREATE INDEX "bundle_details_check_in_idx" ON "bundle_booking_details" USING btree ("check_in_date");--> statement-breakpoint
CREATE INDEX "bundle_packages_business_idx" ON "bundle_packages" USING btree ("business_id");