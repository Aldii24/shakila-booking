import { describe,expect,it } from "vitest";
import { POST as createBooking } from "../app/api/v1/public/bookings/route.js";
import { GET as bookingStatus } from "../app/api/v1/public/bookings/[bookingCode]/status/route.js";

describe("public API error envelope",()=>{
  it("returns stable validation errors without touching the database",async()=>{const response=await createBooking(new Request("http://localhost/api/v1/public/bookings",{method:"POST",headers:{"content-type":"application/json"},body:"{}"}));const envelope=await response.json();expect(response.status).toBe(400);expect(envelope).toMatchObject({data:null,error:{code:"VALIDATION_ERROR"},meta:null});});
  it("secures booking status before querying data",async()=>{const response=await bookingStatus(new Request("http://localhost/api/v1/public/bookings/GLP-260825-001201/status"),{params:Promise.resolve({bookingCode:"GLP-260825-001201"})});const envelope=await response.json();expect(response.status).toBe(401);expect(envelope.error.code).toBe("UNAUTHORIZED");});
});
