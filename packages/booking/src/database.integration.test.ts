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
  const target=sql`select id from bookings where customer_email in ('idempotency@example.test','concurrency-1@example.test','concurrency-2@example.test','cancel@example.test','expire@example.test','jeep-one@example.test','jeep-two@example.test','jeep-other@example.test','boundary-one@example.test','boundary-two@example.test')`;
  await db.execute(sql`delete from booking_events where booking_id in (${target})`);
  await db.execute(sql`delete from accommodation_unit_reservations where booking_id in (${target})`);
  await db.execute(sql`delete from jeep_unit_reservations where booking_id in (${target})`);
  await db.execute(sql`delete from payments where booking_id in (${target})`);
  await db.execute(sql`delete from glamping_booking_details where booking_id in (${target})`);
  await db.execute(sql`delete from jeep_booking_details where booking_id in (${target})`);
  await db.execute(sql`delete from bookings where id in (${target})`);
}

beforeAll(cleanupTestBookings);

integration("transactional booking allocation (requires migrated and seeded TEST_DATABASE_URL)",()=>{
  it("returns one booking for repeated idempotent requests",async()=>{
    const {createGlampingBooking}=await import("./creation.js"); const key=randomUUID();
    const input={business:"glamping" as const,reservation:{productSlug:"deluxe-dome",checkInDate:"2099-01-02",checkOutDate:"2099-01-03",quantity:1,guestCount:2},customer:{fullName:"Idempotency Test",email:"idempotency@example.test",whatsapp:"081200001001"}};
    const first=await createGlampingBooking(input,key), second=await createGlampingBooking(input,key);createdIds.push(first.bookingId);expect(second.bookingId).toBe(first.bookingId);
  });
  it("cannot overbook concurrent attempts for the last accommodation inventory",async()=>{
    const {createGlampingBooking}=await import("./creation.js");
    const make=(suffix:string)=>createGlampingBooking({business:"glamping",reservation:{productSlug:"deluxe-dome",checkInDate:"2099-02-02",checkOutDate:"2099-02-03",quantity:4,guestCount:2},customer:{fullName:`Concurrency ${suffix}`,email:`concurrency-${suffix}@example.test`,whatsapp:`08120000200${suffix}`}},randomUUID());
    const results=await Promise.allSettled([make("1"),make("2")]);for(const item of results)if(item.status==="fulfilled")createdIds.push(item.value.bookingId);expect(results.filter(item=>item.status==="fulfilled")).toHaveLength(1);
  });
  it("accepts checkout boundary reuse and rejects a PostgreSQL-level overlap",async()=>{
    const {createGlampingBooking}=await import("./creation.js");const {getDb}=await import("@booking/database");const db=getDb();
    const make=(checkInDate:string,checkOutDate:string,email:string,whatsapp:string)=>createGlampingBooking({business:"glamping",reservation:{productSlug:"deluxe-dome",checkInDate,checkOutDate,quantity:1,guestCount:2},customer:{fullName:"Boundary Test",email,whatsapp}},randomUUID());
    const first=await make("2099-05-02","2099-05-03","boundary-one@example.test","081200005001");const second=await make("2099-05-03","2099-05-04","boundary-two@example.test","081200005002");createdIds.push(first.bookingId,second.bookingId);
    const units=await db.execute(sql`select booking_id,accommodation_unit_id from accommodation_unit_reservations where booking_id in (${first.bookingId}::uuid,${second.bookingId}::uuid) order by check_in_date`) as unknown as {booking_id:string;accommodation_unit_id:string}[];
    expect(units).toHaveLength(2);expect(units[0]!.accommodation_unit_id).toBe(units[1]!.accommodation_unit_id);
    await expect(db.transaction(tx=>tx.execute(sql`update accommodation_unit_reservations set check_in_date='2099-05-02' where booking_id=${second.bookingId}::uuid`))).rejects.toMatchObject({cause:expect.objectContaining({code:"23P01"})});
  });
  it("releases inventory when a booking expires or is cancelled",async()=>{
    const {calculateAccommodationAvailability}=await import("./availability.js");const {cancelBooking,expireBooking}=await import("./lifecycle.js");const {createGlampingBooking}=await import("./creation.js");const {getDb}=await import("@booking/database");
    const db=getDb();const product=await db.execute(sql`select id from accommodation_types where slug='deluxe-dome' limit 1`) as unknown as {id:string}[];
    const make=(date:string,email:string)=>createGlampingBooking({business:"glamping",reservation:{productSlug:"deluxe-dome",checkInDate:date,checkOutDate:date.slice(0,8)+String(Number(date.slice(8))+1).padStart(2,"0"),quantity:1,guestCount:2},customer:{fullName:"Release Test",email,whatsapp:email.includes("expire")?"081200003001":"081200003002"}},randomUUID());
    const cancelled=await make("2099-03-02","cancel@example.test");createdIds.push(cancelled.bookingId);expect(await calculateAccommodationAvailability({accommodationTypeId:product[0]!.id,checkInDate:"2099-03-02",checkOutDate:"2099-03-03"})).toBe(3);await cancelBooking(cancelled.bookingId);expect(await calculateAccommodationAvailability({accommodationTypeId:product[0]!.id,checkInDate:"2099-03-02",checkOutDate:"2099-03-03"})).toBe(4);
    const expired=await make("2099-03-04","expire@example.test");createdIds.push(expired.bookingId);await db.execute(sql`update bookings set expires_at=now()-interval '1 minute' where id=${expired.bookingId}::uuid`);await expireBooking(expired.bookingId);expect(await calculateAccommodationAvailability({accommodationTypeId:product[0]!.id,checkInDate:"2099-03-04",checkOutDate:"2099-03-05"})).toBe(4);
  });
  it("rejects the same Jeep/date/slot but permits another slot",async()=>{
    const {createJeepBooking}=await import("./creation.js");const {getDb}=await import("@booking/database");const db=getDb();const slots=await db.execute(sql`select id,departure_time from jeep_departure_slots where jeep_package_id=(select id from jeep_packages where slug='full-adventure-experience') order by departure_time`) as unknown as {id:string;departure_time:string}[];
    const make=(slot:string,email:string)=>createJeepBooking({business:"jeep",reservation:{packageSlug:"full-adventure-experience",tourDate:"2099-04-02",departureSlotId:slot,quantity:8,guestCount:2},customer:{fullName:"Jeep Collision",email,whatsapp:email.includes("one")?"081200004001":email.includes("two")?"081200004002":"081200004003"}},randomUUID());
    const collision=await Promise.allSettled([make(slots[0]!.id,"jeep-one@example.test"),make(slots[0]!.id,"jeep-two@example.test")]);for(const item of collision)if(item.status==="fulfilled")createdIds.push(item.value.bookingId);expect(collision.filter(item=>item.status==="fulfilled")).toHaveLength(1);const other=await make(slots[1]!.id,"jeep-other@example.test");createdIds.push(other.bookingId);expect(other.bookingId).toBeTruthy();
  });
});

afterAll(async()=>{if(!testUrl)return;await cleanupTestBookings();const {closeDb}=await import("@booking/database");await closeDb();});
