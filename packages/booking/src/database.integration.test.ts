import { randomUUID } from "node:crypto";
import { afterAll,beforeAll,describe,expect,it } from "vitest";
import { sql } from "drizzle-orm";

const testUrl=process.env.TEST_DATABASE_URL;
if(testUrl) process.env.DATABASE_URL=testUrl;
const integration=describe.skipIf(!testUrl);
const createdIds:string[]=[];

async function cleanupTestBookings(){
  if(!testUrl)return;
  const {getDb}=await import("@booking/database");const db=getDb();
  const target=sql`select id from bookings where customer_email in ('idempotency@example.test','concurrency-1@example.test','concurrency-2@example.test','cancel@example.test','expire@example.test','jeep-one@example.test','jeep-two@example.test','jeep-other@example.test','jeep-shared-one@example.test','jeep-shared-two@example.test','jeep-shared-other-slot@example.test','boundary-one@example.test','boundary-two@example.test','bundle-stock@example.test','bundle-overbook-1@example.test','bundle-overbook-2@example.test','bundle-jeep-fill@example.test','bundle-rollback@example.test') or customer_email like 'accommodation-stock-%' or customer_email like 'jeep-complete-%'`;
  await db.execute(sql`delete from booking_events where booking_id in (${target})`);
  await db.execute(sql`delete from payment_proofs where booking_id in (${target})`);
  await db.execute(sql`delete from payment_attempts where booking_id in (${target})`);
  await db.execute(sql`delete from invoices where booking_id in (${target})`);
  await db.execute(sql`delete from accommodation_unit_reservations where booking_id in (${target})`);
  await db.execute(sql`delete from jeep_unit_reservations where booking_id in (${target})`);
  await db.execute(sql`delete from payments where booking_id in (${target})`);
  await db.execute(sql`delete from glamping_booking_details where booking_id in (${target})`);
  await db.execute(sql`delete from jeep_booking_details where booking_id in (${target})`);
  await db.execute(sql`delete from bundle_booking_details where booking_id in (${target})`);
  await db.execute(sql`delete from bookings where id in (${target})`);
  await db.execute(sql`delete from inventory_blocks where note='bundle rollback integration test'`);
  await db.execute(sql`delete from jeep_departure_slots where name like 'Integration Test %'`);
}

beforeAll(cleanupTestBookings);

integration("transactional booking allocation (requires migrated and seeded TEST_DATABASE_URL)",()=>{
  it("returns one booking for repeated idempotent requests",async()=>{
    const {createGlampingBooking}=await import("./creation.js"); const key=randomUUID();
    const input={business:"glamping" as const,reservation:{productSlug:"glamping-deluxe",checkInDate:"2099-01-02",checkOutDate:"2099-01-03",quantity:1,guestCount:2},customer:{fullName:"Idempotency Test",email:"idempotency@example.test",whatsapp:"081200001001"}};
    const first=await createGlampingBooking(input,key), second=await createGlampingBooking(input,key);createdIds.push(first.bookingId);expect(second.bookingId).toBe(first.bookingId);
  });
  it("cannot overbook concurrent attempts for the last accommodation inventory",async()=>{
    const {createGlampingBooking}=await import("./creation.js");
    const make=(suffix:string)=>createGlampingBooking({business:"glamping",reservation:{productSlug:"glamping-deluxe",checkInDate:"2099-02-02",checkOutDate:"2099-02-03",quantity:2,guestCount:2},customer:{fullName:`Concurrency ${suffix}`,email:`concurrency-${suffix}@example.test`,whatsapp:`08120000200${suffix}`}},randomUUID());
    const results=await Promise.allSettled([make("1"),make("2")]);for(const item of results)if(item.status==="fulfilled")createdIds.push(item.value.bookingId);expect(results.filter(item=>item.status==="fulfilled")).toHaveLength(1);
  });
  it("accepts checkout boundary reuse and rejects a PostgreSQL-level overlap",async()=>{
    const {createGlampingBooking}=await import("./creation.js");const {getDb}=await import("@booking/database");const db=getDb();
    const make=(checkInDate:string,checkOutDate:string,email:string,whatsapp:string)=>createGlampingBooking({business:"glamping",reservation:{productSlug:"glamping-deluxe",checkInDate,checkOutDate,quantity:1,guestCount:2},customer:{fullName:"Boundary Test",email,whatsapp}},randomUUID());
    const first=await make("2099-05-02","2099-05-03","boundary-one@example.test","081200005001");const second=await make("2099-05-03","2099-05-04","boundary-two@example.test","081200005002");createdIds.push(first.bookingId,second.bookingId);
    const units=await db.execute(sql`select booking_id,accommodation_unit_id from accommodation_unit_reservations where booking_id in (${first.bookingId}::uuid,${second.bookingId}::uuid) order by check_in_date`) as unknown as {booking_id:string;accommodation_unit_id:string}[];
    expect(units).toHaveLength(2);expect(units[0]!.accommodation_unit_id).toBe(units[1]!.accommodation_unit_id);
    await expect(db.transaction(tx=>tx.execute(sql`update accommodation_unit_reservations set check_in_date='2099-05-02' where booking_id=${second.bookingId}::uuid`))).rejects.toMatchObject({cause:expect.objectContaining({code:"23P01"})});
  });
  it("releases inventory when a booking expires or is cancelled",async()=>{
    const {calculateAccommodationAvailability}=await import("./availability.js");const {cancelBooking,expireBooking}=await import("./lifecycle.js");const {createGlampingBooking}=await import("./creation.js");const {getDb}=await import("@booking/database");
    const db=getDb();const product=await db.execute(sql`select id from accommodation_types where slug='glamping-deluxe' limit 1`) as unknown as {id:string}[];
    const make=(date:string,email:string)=>createGlampingBooking({business:"glamping",reservation:{productSlug:"glamping-deluxe",checkInDate:date,checkOutDate:date.slice(0,8)+String(Number(date.slice(8))+1).padStart(2,"0"),quantity:1,guestCount:2},customer:{fullName:"Release Test",email,whatsapp:email.includes("expire")?"081200003001":"081200003002"}},randomUUID());
    const cancelled=await make("2099-03-02","cancel@example.test");createdIds.push(cancelled.bookingId);expect(await calculateAccommodationAvailability({accommodationTypeId:product[0]!.id,checkInDate:"2099-03-02",checkOutDate:"2099-03-03"})).toBe(1);await cancelBooking(cancelled.bookingId);expect(await calculateAccommodationAvailability({accommodationTypeId:product[0]!.id,checkInDate:"2099-03-02",checkOutDate:"2099-03-03"})).toBe(2);
    const expired=await make("2099-03-04","expire@example.test");createdIds.push(expired.bookingId);await db.execute(sql`update bookings set expires_at=now()-interval '1 minute' where id=${expired.bookingId}::uuid`);await expireBooking(expired.bookingId);expect(await calculateAccommodationAvailability({accommodationTypeId:product[0]!.id,checkInDate:"2099-03-04",checkOutDate:"2099-03-05"})).toBe(2);
  });
  it("rejects the same Jeep/date/slot but permits another slot",async()=>{
    const {createAdminDepartureSlot}=await import("./admin.js");const {createJeepBooking}=await import("./creation.js");const {getDb}=await import("@booking/database");const db=getDb();const packageRows=await db.execute(sql`select id from jeep_packages where slug='medium-1'`) as unknown as {id:string}[];const firstSlot=await createAdminDepartureSlot(packageRows[0]!.id,{name:"Integration Test Early",departureTime:"09:00"});const secondSlot=await createAdminDepartureSlot(packageRows[0]!.id,{name:"Integration Test Late",departureTime:"15:00"});const slots=[firstSlot,secondSlot] as {id:string}[];
    const make=(slot:string,email:string)=>createJeepBooking({business:"jeep",reservation:{packageSlug:"medium-1",tourDate:"2099-04-02",departureSlotId:slot,quantity:8,guestCount:1},customer:{fullName:"Jeep Collision",email,whatsapp:email.includes("one")?"081200004001":email.includes("two")?"081200004002":"081200004003"}},randomUUID());
    const collision=await Promise.allSettled([make(slots[0]!.id,"jeep-one@example.test"),make(slots[0]!.id,"jeep-two@example.test")]);for(const item of collision)if(item.status==="fulfilled")createdIds.push(item.value.bookingId);expect(collision.filter(item=>item.status==="fulfilled")).toHaveLength(1);const other=await make(slots[1]!.id,"jeep-other@example.test");createdIds.push(other.bookingId);expect(other.bookingId).toBeTruthy();
  });
  it("shares the 12-Jeep fleet across packages at the same departure time",async()=>{
    const {createAdminDepartureSlot}=await import("./admin.js");const {calculateJeepAvailability}=await import("./availability.js");const {createJeepBooking}=await import("./creation.js");const {getDb}=await import("@booking/database");const db=getDb();
    const products=await db.execute(sql`select slug,id,business_id as "businessId" from jeep_packages where slug in ('short-1','long-2')`) as unknown as {slug:string;id:string;businessId:string}[];const shortProduct=products.find(item=>item.slug==="short-1")!,longProduct=products.find(item=>item.slug==="long-2")!;const shortMorning={...(await createAdminDepartureSlot(shortProduct.id,{name:"Integration Test Shared Early",departureTime:"09:15"}) as {id:string}),businessId:shortProduct.businessId};const shortOther=await createAdminDepartureSlot(shortProduct.id,{name:"Integration Test Shared Late",departureTime:"15:15"}) as {id:string};const longMorning={...(await createAdminDepartureSlot(longProduct.id,{name:"Integration Test Shared Other Package",departureTime:"09:15"}) as {id:string}),businessId:longProduct.businessId};
    const make=(packageSlug:string,slot:string,quantity:number,email:string,whatsapp:string)=>createJeepBooking({business:"jeep",reservation:{packageSlug,tourDate:"2099-04-03",departureSlotId:slot,quantity,guestCount:quantity},customer:{fullName:"Shared Fleet Test",email,whatsapp}},randomUUID());
    const first=await make("short-1",shortMorning.id,12,"jeep-shared-one@example.test","081200004011");createdIds.push(first.bookingId);
    expect(await calculateJeepAvailability({businessId:longMorning.businessId,tourDate:"2099-04-03",departureSlotId:longMorning.id})).toBe(0);
    await expect(make("long-2",longMorning.id,1,"jeep-shared-two@example.test","081200004012")).rejects.toMatchObject({code:"INVENTORY_NOT_AVAILABLE"});
    const other=await make("short-1",shortOther.id,12,"jeep-shared-other-slot@example.test","081200004013");createdIds.push(other.bookingId);expect(other.bookingId).toBeTruthy();
  });
  it("holds accommodation stock immediately and keeps public and Admin availability consistent",async()=>{
    const {calculateAccommodationAvailability}=await import("./availability.js");const {getPublicGlampingCalendar}=await import("./availability-calendar.js");const {getAdminCalendar}=await import("./admin.js");const {createGlampingBooking}=await import("./creation.js");const {cancelBooking}=await import("./lifecycle.js");const {getDb}=await import("@booking/database");const db=getDb();
    const product=(await db.execute(sql`select id from accommodation_types where slug='glamping-deluxe' limit 1`)) as unknown as {id:string}[];const input=(index:number)=>({business:"glamping" as const,reservation:{productSlug:"glamping-deluxe",checkInDate:"2099-08-05",checkOutDate:"2099-08-06",quantity:1,guestCount:2},customer:{fullName:`Accommodation Stock ${index}`,email:`accommodation-stock-${index}@example.test`,whatsapp:`08120000810${index}`}});
    const first=await createGlampingBooking(input(1),randomUUID(),db);createdIds.push(first.bookingId);
    expect(await calculateAccommodationAvailability({accommodationTypeId:product[0]!.id,checkInDate:"2099-08-05",checkOutDate:"2099-08-06"},db)).toBe(1);
    const publicCalendar=await getPublicGlampingCalendar({startDate:"2099-08-05",endDate:"2099-08-05"},db);
    expect(publicCalendar.days[0]?.inventory.find(row=>row.productSlug==="glamping-deluxe")?.availableUnits).toBe(1);
    const adminCalendar=await getAdminCalendar("2099-08-05","2099-08-05","glamping",db);
    expect(adminCalendar.bookings.some(row=>row.bookingCode===first.bookingCode)).toBe(true);
    const second=await createGlampingBooking(input(2),randomUUID(),db);createdIds.push(second.bookingId);
    expect(await calculateAccommodationAvailability({accommodationTypeId:product[0]!.id,checkInDate:"2099-08-05",checkOutDate:"2099-08-06"},db)).toBe(0);
    await expect(createGlampingBooking(input(3),randomUUID(),db)).rejects.toMatchObject({code:"INVENTORY_NOT_AVAILABLE"});
    await cancelBooking(first.bookingId,db);
    expect(await calculateAccommodationAvailability({accommodationTypeId:product[0]!.id,checkInDate:"2099-08-05",checkOutDate:"2099-08-06"},db)).toBe(1);
    const checkoutCalendar=await getAdminCalendar("2099-08-06","2099-08-06","glamping",db);
    expect(checkoutCalendar.bookings.some(row=>row.bookingCode===second.bookingCode)).toBe(false);
  });
  it("releases one completed Jeep exactly once and allows same-day reuse",async()=>{
    const {adminBookingCommand}=await import("./admin.js");const {calculateJeepAvailability}=await import("./availability.js");const {createJeepBooking}=await import("./creation.js");const {getDb}=await import("@booking/database");const db=getDb();
    const slot=(await db.execute(sql`select s.id,b.id as "businessId" from jeep_departure_slots s join jeep_packages p on p.id=s.jeep_package_id join businesses b on b.id=s.business_id where p.slug='short-1' and s.is_active order by s.departure_time nulls last,s.created_at limit 1`)) as unknown as {id:string;businessId:string}[];const selected=slot[0]!;
    const make=(index:number)=>createJeepBooking({business:"jeep",reservation:{packageSlug:"short-1",tourDate:"2099-08-07",departureSlotId:selected.id,quantity:1,guestCount:1},customer:{fullName:`Jeep Complete ${index}`,email:`jeep-complete-${index}@example.test`,whatsapp:`0812000082${String(index).padStart(2,"0")}`}},randomUUID(),db);
    const bookings=[];for(let index=1;index<=12;index++){const booking=await make(index);bookings.push(booking);createdIds.push(booking.bookingId);}
    expect(await calculateJeepAvailability({businessId:selected.businessId,tourDate:"2099-08-07",departureSlotId:selected.id},db)).toBe(0);
    const first=bookings[0]!;await db.execute(sql`update bookings set status='CONFIRMED',payment_status='PAID',verified_paid_amount=total_amount,remaining_amount=0,confirmed_at=now() where id=${first.bookingId}::uuid`);await db.execute(sql`update payments set status='PAID',verified_amount=expected_amount,verified_at=now() where booking_id=${first.bookingId}::uuid`);await db.execute(sql`update jeep_unit_reservations set state='CONFIRMED' where booking_id=${first.bookingId}::uuid`);
    await expect(adminBookingCommand(first.bookingCode,"check-in",{},db)).rejects.toMatchObject({code:"BOOKING_LIFECYCLE_NOT_ALLOWED"});
    expect(await adminBookingCommand(first.bookingCode,"complete",{},db)).toMatchObject({status:"COMPLETED",duplicate:false});
    expect(await calculateJeepAvailability({businessId:selected.businessId,tourDate:"2099-08-07",departureSlotId:selected.id},db)).toBe(1);
    expect(await adminBookingCommand(first.bookingCode,"complete",{},db)).toMatchObject({status:"COMPLETED",duplicate:true});
    expect(await calculateJeepAvailability({businessId:selected.businessId,tourDate:"2099-08-07",departureSlotId:selected.id},db)).toBe(1);
    const replacement=await make(13);createdIds.push(replacement.bookingId);
    expect(await calculateJeepAvailability({businessId:selected.businessId,tourDate:"2099-08-07",departureSlotId:selected.id},db)).toBe(0);
  });
  it("menghitung inventori fisik Glamping dan Homestay sesuai katalog client",async()=>{
    const {calculateAccommodationAvailability}=await import("./availability.js");const {getDb}=await import("@booking/database");const db=getDb();
    const products=await db.execute(sql`select id,slug from accommodation_types where slug in ('glamping-deluxe','glamping-twin-bed','homestay-standard','homestay-superior','homestay-twin-bed')`) as unknown as {id:string;slug:string}[];
    const expected:Record<string,number>={"glamping-deluxe":2,"glamping-twin-bed":4,"homestay-standard":1,"homestay-superior":3,"homestay-twin-bed":1};
    for(const product of products) expect(await calculateAccommodationAvailability({accommodationTypeId:product.id,checkInDate:"2099-06-02",checkOutDate:"2099-06-03"})).toBe(expected[product.slug]);
    expect(products).toHaveLength(5);
  });
  it("bundle mengurangi stok kamar dan Jeep dalam satu booking",async()=>{
    const {calculateBundleAvailability}=await import("./availability.js");const {createBundleBooking}=await import("./creation.js");const {getDb}=await import("@booking/database");const db=getDb();
    const before=await calculateBundleAvailability({bundleSlug:"family-deluxe-medium-2",checkInDate:"2099-07-02",checkOutDate:"2099-07-05"});
    const booking=await createBundleBooking({business:"bundle",reservation:{bundleSlug:"family-deluxe-medium-2",checkInDate:"2099-07-02",checkOutDate:"2099-07-05",quantity:1,guestCount:4},customer:{fullName:"Bundle Stock",email:"bundle-stock@example.test",whatsapp:"081200007001"}},randomUUID());createdIds.push(booking.bookingId);
    const counts=await db.execute(sql`select (select count(*)::int from accommodation_unit_reservations where booking_id=${booking.bookingId}::uuid) rooms,(select count(distinct jeep_unit_id)::int from jeep_unit_reservations where booking_id=${booking.bookingId}::uuid) jeeps,(select night_count::int from glamping_booking_details where booking_id=${booking.bookingId}::uuid) nights`) as unknown as {rooms:number;jeeps:number;nights:number}[];
    expect(counts[0]).toEqual({rooms:1,jeeps:1,nights:3});expect(await calculateBundleAvailability({bundleSlug:"family-deluxe-medium-2",checkInDate:"2099-07-02",checkOutDate:"2099-07-05"})).toBe(before-1);
  });
  it("bundle tidak dapat overbook resource terakhir",async()=>{
    const {createBundleBooking}=await import("./creation.js");
    const make=(suffix:string)=>createBundleBooking({business:"bundle",reservation:{bundleSlug:"group-twin-bed-medium-1",checkInDate:"2099-07-05",checkOutDate:"2099-07-07",quantity:4,guestCount:16},customer:{fullName:`Bundle Overbook ${suffix}`,email:`bundle-overbook-${suffix}@example.test`,whatsapp:`08120000710${suffix}`}},randomUUID());
    const results=await Promise.allSettled([make("1"),make("2")]);for(const item of results)if(item.status==="fulfilled")createdIds.push(item.value.bookingId);expect(results.filter(item=>item.status==="fulfilled")).toHaveLength(1);
  });
  it("kegagalan resource Jeep me-rollback reservasi kamar bundle",async()=>{
    const {createBundleBooking}=await import("./creation.js");const {getDb}=await import("@booking/database");const db=getDb();
    await db.execute(sql`insert into inventory_blocks (business_id,resource_type,jeep_unit_id,start_date,reason,note) select business_id,'JEEP_UNIT',id,'2099-07-08','MAINTENANCE','bundle rollback integration test' from jeep_units where is_active`);
    await expect(createBundleBooking({business:"bundle",reservation:{bundleSlug:"family-deluxe-medium-2",checkInDate:"2099-07-08",checkOutDate:"2099-07-10",quantity:1,guestCount:4},customer:{fullName:"Bundle Rollback",email:"bundle-rollback@example.test",whatsapp:"081200007202"}},randomUUID())).rejects.toMatchObject({code:"INVENTORY_NOT_AVAILABLE"});
    const partial=await db.execute(sql`select (select count(*)::int from bookings where customer_email='bundle-rollback@example.test') bookings,(select count(*)::int from accommodation_unit_reservations r join bookings b on b.id=r.booking_id where b.customer_email='bundle-rollback@example.test') rooms,(select count(*)::int from jeep_unit_reservations r join bookings b on b.id=r.booking_id where b.customer_email='bundle-rollback@example.test') jeeps`) as unknown as {bookings:number;rooms:number;jeeps:number}[];
    expect(partial[0]).toEqual({bookings:0,rooms:0,jeeps:0});
  });
});

afterAll(async()=>{if(!testUrl)return;await cleanupTestBookings();const {closeDb}=await import("@booking/database");await closeDb();});
