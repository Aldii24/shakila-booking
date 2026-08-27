UPDATE "businesses"
SET
  "name" = CASE "slug"
    WHEN 'glamping' THEN 'Shakila Glamping'
    WHEN 'jeep' THEN 'Shakila Jeep Tour'
    ELSE "name"
  END,
  "email" = CASE "slug"
    WHEN 'glamping' THEN 'reservasi@shakilagroup.demo'
    WHEN 'jeep' THEN 'tour@shakilagroup.demo'
    ELSE "email"
  END,
  "updated_at" = now()
WHERE "slug" IN ('glamping', 'jeep');
--> statement-breakpoint
UPDATE "business_settings" AS "settings"
SET
  "contact_email" = CASE "businesses"."slug"
    WHEN 'glamping' THEN 'reservasi@shakilagroup.demo'
    WHEN 'jeep' THEN 'tour@shakilagroup.demo'
    ELSE "settings"."contact_email"
  END,
  "updated_at" = now()
FROM "businesses"
WHERE "settings"."business_id" = "businesses"."id"
  AND "businesses"."slug" IN ('glamping', 'jeep');
