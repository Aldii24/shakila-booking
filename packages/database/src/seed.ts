import postgres from "postgres";
import { getDatabaseUrl } from "./client";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_RESEED !== "true") {
  throw new Error("Demo reseed is disabled in production. Set ALLOW_DEMO_RESEED=true only for a controlled reseed.");
}

const client = postgres(getDatabaseUrl(), { max: 1, prepare: false });
const uuid = (key: string) => `(
  substr(md5('${key}'),1,8)||'-'||substr(md5('${key}'),9,4)||'-'||substr(md5('${key}'),13,4)||'-'||substr(md5('${key}'),17,4)||'-'||substr(md5('${key}'),21,12)
)::uuid`;
const glampingId=uuid("business-glamping"), jeepId=uuid("business-jeep");
const deluxeId=uuid("type-deluxe"), familyId=uuid("type-family"), sunriseId=uuid("package-sunrise"), fullId=uuid("package-full");

const names=["Ayu Lestari","Bagas Wicaksono","Dimas Saputra","Farah Putri","Intan Permata","Maya Anggraini","Rizky Pratama","Nadia Kusuma","Fajar Hidayat","Sari Maharani","Arif Nugroho","Citra Dewi","Galih Ramadhan","Hana Safitri","Ilham Maulana","Jihan Azzahra","Kevin Santoso","Laras Wulandari","Mahesa Putra","Nabila Rahma","Oka Wijaya","Puspa Kirana","Raka Aditya","Sekar Melati","Tegar Firmansyah","Vina Oktavia","Wahyu Setiawan","Yasmin Putri","Zaki Akbar","Anisa Permata"];
const customerSql=names.map((name,index)=>`insert into customers (id,full_name,email,email_normalized,whatsapp,whatsapp_normalized) values (${uuid(`customer-${index+1}`)},'${name}', 'demo${index+1}@example.test','demo${index+1}@example.test','+62812000${String(index+1).padStart(4,"0")}','62812000${String(index+1).padStart(4,"0")}') on conflict(id) do update set full_name=excluded.full_name,email=excluded.email,email_normalized=excluded.email_normalized,whatsapp=excluded.whatsapp,whatsapp_normalized=excluded.whatsapp_normalized,updated_at=now();`).join("\n");
const accommodationUnits=[...Array(6)].map((_,i)=>`insert into accommodation_units (id,accommodation_type_id,code,name) values (${uuid(`accommodation-unit-${i+1}`)},${i<4?deluxeId:familyId},'${i<4?"DOME":"FAMILY"}-${String((i<4?i:i-4)+1).padStart(2,"0")}','${i<4?"Dome":"Family Dome"} ${String((i<4?i:i-4)+1).padStart(2,"0")}') on conflict(id) do update set is_active=true,updated_at=now();`).join("\n");
const jeepUnits=[...Array(8)].map((_,i)=>`insert into jeep_units (id,business_id,code,name) values (${uuid(`jeep-unit-${i+1}`)},${jeepId},'JEEP-${String(i+1).padStart(2,"0")}','Jeep ${String(i+1).padStart(2,"0")}') on conflict(id) do update set is_active=true,updated_at=now();`).join("\n");

const seedSql=`
set local timezone='Asia/Jakarta';
delete from booking_events where booking_id in (select id from bookings where booking_code like 'GLP-%-9%' or booking_code like 'JEP-%-9%');
delete from invoices where booking_id in (select id from bookings where booking_code like 'GLP-%-9%' or booking_code like 'JEP-%-9%');
delete from payment_attempts where booking_id in (select id from bookings where booking_code like 'GLP-%-9%' or booking_code like 'JEP-%-9%');
delete from payments where booking_id in (select id from bookings where booking_code like 'GLP-%-9%' or booking_code like 'JEP-%-9%');
delete from accommodation_unit_reservations where booking_id in (select id from bookings where booking_code like 'GLP-%-9%');
delete from jeep_unit_reservations where booking_id in (select id from bookings where booking_code like 'JEP-%-9%');
delete from glamping_booking_details where booking_id in (select id from bookings where booking_code like 'GLP-%-9%');
delete from jeep_booking_details where booking_id in (select id from bookings where booking_code like 'JEP-%-9%');
delete from bookings where booking_code like 'GLP-%-9%' or booking_code like 'JEP-%-9%';
delete from inventory_blocks where note='FAST-1 deterministic demo seed';

insert into businesses (id,code,slug,name,type,email,phone,address) values
(${glampingId},'GLP','glamping','Shakila Glamping','ACCOMMODATION','reservasi@shakilagroup.demo','+6281230001000','Nepal van Java'),
(${jeepId},'JEP','jeep','Shakila Jeep Tour','ACTIVITY','tour@shakilagroup.demo','+6281230002000','Nepal van Java')
on conflict(id) do update set name=excluded.name,address=excluded.address,is_active=true,updated_at=now();
insert into business_settings (business_id,dp_percentage,booking_hold_minutes,default_check_in_time,default_check_out_time,contact_email,contact_phone) values
(${glampingId},50,720,'13:00','12:00','reservasi@shakilagroup.demo','+6281230001000'),(${jeepId},50,720,null,null,'tour@shakilagroup.demo','+6281230002000')
on conflict(business_id) do update set dp_percentage=50,booking_hold_minutes=720,default_check_in_time=excluded.default_check_in_time,default_check_out_time=excluded.default_check_out_time,updated_at=now();
insert into accommodation_types (id,business_id,slug,name,description,base_price,capacity_per_unit,sort_order) values
(${deluxeId},${glampingId},'deluxe-dome','Deluxe Dome','Dome hangat untuk dua tamu dengan pemandangan pegunungan.',850000,2,1),
(${familyId},${glampingId},'family-dome','Family Dome','Dome lapang untuk keluarga hingga empat tamu.',1250000,4,2)
on conflict(id) do update set base_price=excluded.base_price,is_active=true,updated_at=now();
${accommodationUnits}
insert into jeep_packages (id,business_id,slug,name,description,price_per_unit,capacity_per_unit,sort_order) values
(${sunriseId},${jeepId},'sunrise-adventure','Sunrise Adventure','Perjalanan Jeep privat untuk menikmati suasana fajar.',750000,6,1),
(${fullId},${jeepId},'full-adventure-experience','Full Adventure Experience','Perjalanan Jeep yang lebih lengkap dengan waktu dan lintasan lebih panjang.',950000,6,2)
on conflict(id) do update set slug=excluded.slug,name=excluded.name,description=excluded.description,price_per_unit=excluded.price_per_unit,is_active=true,updated_at=now();
insert into jeep_departure_slots (id,business_id,jeep_package_id,name,departure_time) values
(${uuid("slot-sunrise")},${jeepId},${sunriseId},'Sunrise','03:00'),
(${uuid("slot-midday")},${jeepId},${fullId},'Sunrise','03:00'),
(${uuid("slot-morning")},${jeepId},${fullId},'Morning','08:00')
on conflict(id) do update set is_active=true,updated_at=now();
${jeepUnits}
${customerSql}

insert into bookings (id,booking_code,business_id,customer_id,booking_type,status,payment_status,customer_name,customer_email,customer_whatsapp,customer_email_normalized,customer_whatsapp_normalized,guest_count,quantity,subtotal_amount,total_amount,dp_percentage,required_dp_amount,verified_paid_amount,remaining_amount,expires_at,confirmed_at,cancelled_at,checked_in_at,checked_out_at,completed_at,created_at,updated_at)
select md5('glamp-booking-'||i)::uuid,
 'GLP-'||to_char(current_date,'YYMMDD')||'-9'||lpad(i::text,5,'0'),${glampingId},md5('customer-'||(1+(i-1)%30))::uuid,'ACCOMMODATION',
 case when i<=9 then 'COMPLETED'::booking_status when i<=12 then 'CHECKED_OUT' when i=13 then 'CHECKED_IN' when i<=21 then 'CONFIRMED' when i<=24 then 'WAITING_PAYMENT' when i<=27 then 'EXPIRED' else 'CANCELLED' end,
 case when i<=21 then case when i%3=0 then 'PAID'::payment_status else 'PARTIALLY_PAID' end when i=29 then 'PARTIALLY_PAID' else 'UNPAID' end,
 c.full_name,c.email,c.whatsapp,c.email_normalized,c.whatsapp_normalized,case when i%2=0 then 2 else 1 end,1,
 case when i=6 then 800000 else 850000 end,case when i=6 then 800000 else 850000 end,30,case when i=6 then 240000 else 255000 end,
 case when i<=21 then case when i%3=0 then case when i=6 then 800000 else 850000 end else case when i=6 then 240000 else 255000 end end when i=29 then 255000 else 0 end,
 case when i<=21 and i%3=0 then 0 when i<=21 then case when i=6 then 560000 else 595000 end when i=29 then 595000 else case when i=6 then 800000 else 850000 end end,
 case when i between 22 and 24 then now()+interval '12 hours' else null end,
 case when i<=21 or i=29 then now()-interval '3 days' else null end,case when i>=28 then now()-interval '1 day' else null end,
 case when i between 1 and 13 then now()-interval '4 hours' else null end,case when i<=12 then now()-interval '1 hour' else null end,case when i<=9 then now() else null end,
 now()-interval '10 days',now()
from generate_series(1,29) i join customers c on c.id=md5('customer-'||(1+(i-1)%30))::uuid;
`;

await client.begin(async transaction => {
  await transaction.unsafe(seedSql);
  await transaction.unsafe(`
    update bookings set subtotal_amount=1250000,total_amount=1250000,required_dp_amount=375000,verified_paid_amount=case when payment_status='PAID' then 1250000 when payment_status='PARTIALLY_PAID' then 375000 else 0 end,remaining_amount=case when payment_status='PAID' then 0 when payment_status='PARTIALLY_PAID' then 875000 else 1250000 end where booking_code like 'GLP-%-9%' and right(booking_code,5)::int%4=0;
    insert into glamping_booking_details (booking_id,accommodation_type_id,check_in_date,check_out_date,night_count,product_name_snapshot,unit_price_snapshot,capacity_snapshot)
    select b.id,case when n%4=0 then ${familyId} else ${deluxeId} end,case when n<=9 then current_date-n when n<=12 then current_date-1 when n=13 then current_date else current_date+n-10 end,case when n<=9 then current_date-n+1 when n<=12 then current_date when n=13 then current_date+1 else current_date+n-9 end,1,case when n%4=0 then 'Family Dome' else 'Deluxe Dome' end,case when n%4=0 then 1250000 when n=6 then 800000 else 850000 end,case when n%4=0 then 4 else 2 end from bookings b cross join lateral (select right(b.booking_code,5)::int n) x where b.booking_code like 'GLP-%-9%';
    insert into accommodation_unit_reservations (booking_id,accommodation_unit_id,check_in_date,check_out_date,state,released_at)
    select b.id,md5('accommodation-unit-'||(case when n%4=0 then 5+(n%2) else 1+(n-1)%4 end))::uuid,g.check_in_date,g.check_out_date,case when b.status='CHECKED_IN' then 'IN_USE'::reservation_state when b.status in('CONFIRMED','WAITING_PAYMENT') then case when b.status='CONFIRMED' then 'CONFIRMED'::reservation_state else 'HELD' end else 'RELEASED' end,case when b.status in('COMPLETED','CHECKED_OUT','EXPIRED','CANCELLED') then now() else null end from bookings b join glamping_booking_details g on g.booking_id=b.id cross join lateral (select right(b.booking_code,5)::int n) x where b.booking_code like 'GLP-%-9%';

    insert into bookings (id,booking_code,business_id,customer_id,booking_type,status,payment_status,customer_name,customer_email,customer_whatsapp,customer_email_normalized,customer_whatsapp_normalized,guest_count,quantity,subtotal_amount,total_amount,dp_percentage,required_dp_amount,verified_paid_amount,remaining_amount,expires_at,confirmed_at,cancelled_at,checked_in_at,checked_out_at,completed_at,created_at,updated_at)
    select md5('jeep-booking-'||i)::uuid,'JEP-'||to_char(current_date,'YYMMDD')||'-9'||lpad(i::text,5,'0'),${jeepId},c.id,'JEEP',case when i<=6 then 'COMPLETED'::booking_status when i=7 then 'CHECKED_OUT' when i=8 then 'CHECKED_IN' when i<=15 then 'CONFIRMED' when i<=17 then 'WAITING_PAYMENT' when i=18 then 'EXPIRED' else 'CANCELLED' end,case when i<=15 then case when i%3=0 then 'PAID'::payment_status else 'PARTIALLY_PAID' end else 'UNPAID' end,c.full_name,c.email,c.whatsapp,c.email_normalized,c.whatsapp_normalized,2,1,case when i%2=0 then 950000 else 750000 end,case when i%2=0 then 950000 else 750000 end,50,case when i%2=0 then 475000 else 375000 end,case when i<=15 then case when i%3=0 then case when i%2=0 then 950000 else 750000 end else case when i%2=0 then 475000 else 375000 end end else 0 end,case when i<=15 and i%3=0 then 0 when i<=15 then case when i%2=0 then 475000 else 375000 end else case when i%2=0 then 950000 else 750000 end end,case when i between 16 and 17 then now()+interval '12 hours' else null end,case when i<=15 then now()-interval '2 days' else null end,case when i=19 then now()-interval '1 day' else null end,case when i<=8 then now()-interval '4 hours' else null end,case when i<=7 then now()-interval '1 hour' else null end,case when i<=6 then now() else null end,now()-interval '8 days',now() from generate_series(1,19)i join customers c on c.id=md5('customer-'||(1+(i+10)%30))::uuid;
    insert into jeep_booking_details (booking_id,jeep_package_id,departure_slot_id,tour_date,package_name_snapshot,unit_price_snapshot,capacity_snapshot,departure_time_snapshot) select b.id,case when n%2=0 then ${fullId} else ${sunriseId} end,case when n%2=0 then ${uuid("slot-morning")} else ${uuid("slot-sunrise")} end,case when n<=6 then current_date-n when n=7 then current_date-1 when n=8 then current_date else current_date+n-8 end,case when n%2=0 then 'Full Adventure Experience' else 'Sunrise Adventure' end,case when n%2=0 then 950000 else 750000 end,6,case when n%2=0 then '08:00'::time else '03:00'::time end from bookings b cross join lateral(select right(b.booking_code,5)::int n)x where b.booking_code like 'JEP-%-9%';
    insert into jeep_unit_reservations (booking_id,jeep_unit_id,departure_slot_id,tour_date,state,released_at) select b.id,md5('jeep-unit-'||(1+(n-1)%8))::uuid,j.departure_slot_id,j.tour_date,case when b.status='CHECKED_IN' then 'IN_USE'::reservation_state when b.status in('CONFIRMED','WAITING_PAYMENT') then case when b.status='CONFIRMED' then 'CONFIRMED'::reservation_state else 'HELD' end else 'RELEASED' end,case when b.status in('COMPLETED','CHECKED_OUT','EXPIRED','CANCELLED') then now() else null end from bookings b join jeep_booking_details j on j.booking_id=b.id cross join lateral(select right(b.booking_code,5)::int n)x where b.booking_code like 'JEP-%-9%';

    insert into payments (booking_id,expected_amount,verified_amount,status,verified_at) select id,required_dp_amount,verified_paid_amount,payment_status,case when verified_paid_amount>0 then confirmed_at else null end from bookings where booking_code like 'GLP-%-9%' or booking_code like 'JEP-%-9%';
    insert into payment_attempts (payment_id,booking_id,provider,provider_order_id,provider_transaction_id,requested_amount,verified_amount,status,payment_method,verified_at) select p.id,b.id,'DEMO_SEED','DEMO-'||b.booking_code,case when p.verified_amount>0 then 'TX-'||b.booking_code else null end,p.expected_amount,p.verified_amount,case when p.verified_amount>0 then 'SUCCESS'::payment_attempt_status else 'CREATED' end,case when p.verified_amount>0 then 'VIRTUAL_ACCOUNT' else null end,p.verified_at from payments p join bookings b on b.id=p.booking_id where b.booking_code like 'GLP-%-9%' or b.booking_code like 'JEP-%-9%';
    insert into payment_attempts (payment_id,booking_id,provider,provider_order_id,requested_amount,status,failed_at) select p.id,b.id,'DEMO_SEED','RETRY-'||b.booking_code,p.expected_amount,'FAILED',b.created_at+interval '10 minutes' from payments p join bookings b on b.id=p.booking_id where (b.booking_code like 'GLP-%-9%' or b.booking_code like 'JEP-%-9%') and right(b.booking_code,1)::int in(2,4,6,8) limit 8;
    insert into invoices (booking_id,invoice_number,status,total_amount,paid_amount,remaining_amount,issued_at,generated_at,file_name) select b.id,'INV-'||to_char(current_date,'YYYYMMDD')||'-'||lpad(row_number() over(order by b.booking_code)::text,5,'0'),'GENERATED',b.total_amount,b.verified_paid_amount,b.remaining_amount,b.confirmed_at,b.confirmed_at+interval '1 minute','INV-'||b.booking_code||'.pdf' from bookings b where b.verified_paid_amount>0 and (b.booking_code like 'GLP-%-9%' or b.booking_code like 'JEP-%-9%');
    insert into booking_events (booking_id,event_type,actor_type,title,created_at) select id,'BOOKING_CREATED','CUSTOMER','Booking created',created_at from bookings where booking_code like 'GLP-%-9%' or booking_code like 'JEP-%-9%';
    insert into booking_events (booking_id,event_type,actor_type,title,created_at) select id,'BOOKING_CONFIRMED','SYSTEM','Booking confirmed',confirmed_at from bookings where confirmed_at is not null and (booking_code like 'GLP-%-9%' or booking_code like 'JEP-%-9%');
    insert into inventory_blocks (business_id,resource_type,accommodation_unit_id,start_date,end_date,reason,note) values (${glampingId},'ACCOMMODATION_UNIT',${uuid("accommodation-unit-4")},current_date+40,current_date+42,'MAINTENANCE','FAST-1 deterministic demo seed');
    insert into inventory_blocks (business_id,resource_type,jeep_unit_id,start_date,departure_slot_id,reason,note) values (${jeepId},'JEEP_UNIT',${uuid("jeep-unit-8")},current_date+40,${uuid("slot-sunrise")},'MAINTENANCE','FAST-1 deterministic demo seed');
  `);
});

await client.end();
console.log("Seeded 2 businesses, 30 customers, 48 bookings, 56 payment attempts, and physical reservations without external side effects.");
