-- Correct stale demo location data without resetting bookings or inventory.
UPDATE "businesses"
SET "address" = 'Nepal van Java', "updated_at" = now()
WHERE "slug" IN ('glamping', 'jeep');
