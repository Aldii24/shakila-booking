-- Keep the legacy slug stable for existing links/API clients while correcting
-- the public package name and copy.
UPDATE "jeep_packages"
SET
  "slug" = 'full-adventure-experience',
  "name" = 'Full Adventure Experience',
  "description" = 'Perjalanan Jeep yang lebih lengkap dengan waktu dan lintasan lebih panjang.',
  "updated_at" = now()
WHERE "slug" = 'full-bromo-experience';
--> statement-breakpoint
UPDATE "jeep_packages"
SET
  "description" = 'Perjalanan Jeep privat untuk menikmati suasana fajar.',
  "updated_at" = now()
WHERE "slug" = 'sunrise-adventure';
--> statement-breakpoint
-- This is a terminology correction for existing demo records, not a pricing
-- recalculation. Financial and capacity snapshots remain unchanged.
UPDATE "jeep_booking_details"
SET "package_name_snapshot" = 'Full Adventure Experience'
WHERE "package_name_snapshot" = 'Full Bromo Experience';
