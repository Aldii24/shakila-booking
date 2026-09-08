ALTER TABLE "jeep_booking_details" ALTER COLUMN "departure_time_snapshot" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "jeep_departure_slots" ALTER COLUMN "departure_time" DROP NOT NULL;--> statement-breakpoint
DO $$
DECLARE
  artifact_customer_ids uuid[];
  artifact_booking_ids uuid[];
BEGIN
  SELECT coalesce(array_agg(id), ARRAY[]::uuid[]) INTO artifact_customer_ids
  FROM customers
  WHERE (
    id IN (SELECT md5('customer-' || i)::uuid FROM generate_series(1, 30) i)
    AND email_normalized ~ '^demo[0-9]+@example\.test$'
  ) OR email_normalized LIKE 'uat.prod.%@example.com'
    OR email_normalized LIKE 'production-smoke-%@example.com'
    OR email_normalized IN ('smoke-manual-payment@example.test', 'smoke-manual-booking@example.test');

  SELECT coalesce(array_agg(id), ARRAY[]::uuid[]) INTO artifact_booking_ids
  FROM bookings WHERE customer_id = ANY(artifact_customer_ids);

  DELETE FROM payment_proofs WHERE booking_id = ANY(artifact_booking_ids);
  DELETE FROM booking_events WHERE booking_id = ANY(artifact_booking_ids);
  DELETE FROM invoices WHERE booking_id = ANY(artifact_booking_ids);
  DELETE FROM payment_attempts WHERE booking_id = ANY(artifact_booking_ids);
  DELETE FROM payments WHERE booking_id = ANY(artifact_booking_ids);
  DELETE FROM accommodation_unit_reservations WHERE booking_id = ANY(artifact_booking_ids);
  DELETE FROM jeep_unit_reservations WHERE booking_id = ANY(artifact_booking_ids);
  DELETE FROM bundle_booking_details WHERE booking_id = ANY(artifact_booking_ids);
  DELETE FROM glamping_booking_details WHERE booking_id = ANY(artifact_booking_ids);
  DELETE FROM jeep_booking_details WHERE booking_id = ANY(artifact_booking_ids);
  DELETE FROM bookings WHERE id = ANY(artifact_booking_ids);
  DELETE FROM customers c WHERE c.id = ANY(artifact_customer_ids) AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.customer_id=c.id);
  DELETE FROM inventory_blocks WHERE note='FAST-1 deterministic demo seed';

  DELETE FROM accommodation_units u
  USING accommodation_types t
  WHERE u.accommodation_type_id=t.id AND t.slug IN ('deluxe-dome','family-dome')
    AND NOT EXISTS (SELECT 1 FROM accommodation_unit_reservations r WHERE r.accommodation_unit_id=u.id)
    AND NOT EXISTS (SELECT 1 FROM inventory_blocks b WHERE b.accommodation_unit_id=u.id);
  UPDATE accommodation_units u SET is_active=false,updated_at=now()
  FROM accommodation_types t WHERE u.accommodation_type_id=t.id AND t.slug IN ('deluxe-dome','family-dome');
  DELETE FROM accommodation_types t WHERE t.slug IN ('deluxe-dome','family-dome')
    AND NOT EXISTS (SELECT 1 FROM accommodation_units u WHERE u.accommodation_type_id=t.id)
    AND NOT EXISTS (SELECT 1 FROM glamping_booking_details g WHERE g.accommodation_type_id=t.id)
    AND NOT EXISTS (SELECT 1 FROM bundle_packages b WHERE b.accommodation_type_id=t.id);
  UPDATE accommodation_types SET is_active=false,updated_at=now() WHERE slug IN ('deluxe-dome','family-dome');

  DELETE FROM jeep_departure_slots s
  WHERE (s.is_demo_data OR lower(s.name) LIKE '%demo%')
    AND NOT EXISTS (SELECT 1 FROM jeep_booking_details d WHERE d.departure_slot_id=s.id)
    AND NOT EXISTS (SELECT 1 FROM jeep_unit_reservations r WHERE r.departure_slot_id=s.id)
    AND NOT EXISTS (SELECT 1 FROM inventory_blocks b WHERE b.departure_slot_id=s.id);
  UPDATE jeep_departure_slots SET name='Jadwal Lama',is_demo_data=false,is_active=false,updated_at=now()
  WHERE is_demo_data OR lower(name) LIKE '%demo%';

  DELETE FROM jeep_departure_slots s USING jeep_packages p
  WHERE s.jeep_package_id=p.id AND p.slug IN ('sunrise-adventure','full-adventure-experience')
    AND NOT EXISTS (SELECT 1 FROM jeep_booking_details d WHERE d.departure_slot_id=s.id)
    AND NOT EXISTS (SELECT 1 FROM jeep_unit_reservations r WHERE r.departure_slot_id=s.id)
    AND NOT EXISTS (SELECT 1 FROM inventory_blocks b WHERE b.departure_slot_id=s.id);
  UPDATE jeep_departure_slots s SET name='Jadwal Lama',is_active=false,is_demo_data=false,updated_at=now()
  FROM jeep_packages p WHERE s.jeep_package_id=p.id AND p.slug IN ('sunrise-adventure','full-adventure-experience');
  DELETE FROM jeep_packages p WHERE p.slug IN ('sunrise-adventure','full-adventure-experience')
    AND NOT EXISTS (SELECT 1 FROM jeep_departure_slots s WHERE s.jeep_package_id=p.id)
    AND NOT EXISTS (SELECT 1 FROM jeep_booking_details d WHERE d.jeep_package_id=p.id)
    AND NOT EXISTS (SELECT 1 FROM bundle_packages b WHERE b.jeep_package_id=p.id);
  UPDATE jeep_packages SET is_active=false,updated_at=now() WHERE slug IN ('sunrise-adventure','full-adventure-experience');

  UPDATE accommodation_types SET is_demo_data=false,is_active=true,updated_at=now()
  WHERE slug IN ('glamping-deluxe','glamping-twin-bed','homestay-standard','homestay-superior','homestay-twin-bed');
  UPDATE accommodation_types SET description='Kamar Homestay Twin Bed di kawasan Nepal van Java.',is_demo_data=false,updated_at=now()
  WHERE slug='homestay-twin-bed';

  UPDATE jeep_packages SET is_demo_data=false,is_active=true,facilities='["Jeep wisata","Pengemudi lokal"]'::jsonb,updated_at=now()
  WHERE slug IN ('short-1','short-2','medium-1','medium-2','long-1','long-2');

  INSERT INTO jeep_departure_slots(id,business_id,jeep_package_id,name,departure_time,is_demo_data,is_active)
  SELECT md5('client-jeep-' || p.slug || '-schedule')::uuid,p.business_id,p.id,'Jadwal Keberangkatan',null,false,true
  FROM jeep_packages p WHERE p.slug IN ('short-1','short-2','medium-1','medium-2','long-1','long-2')
  ON CONFLICT(id) DO UPDATE SET name=excluded.name,departure_time=null,is_demo_data=false,is_active=true,updated_at=now();

  UPDATE jeep_units SET is_demo_inventory=false,updated_at=now();
END $$;
