import { describe,expect,it } from "vitest";
import { assertCapacity } from "./availability.js";
import { assertJeepDepartureOpen,bookingExpiration,calculateDp,calculateGlampingPrice,calculateJeepPrice,calculateNightCount,validateBookingTransition } from "./core.js";
import { normalizeEmail,normalizeWhatsApp } from "@booking/validation";

describe("booking calculations",()=>{
  it("calculates the minimum 50 percent DP in whole rupiah",()=>expect(calculateDp(1001,50)).toBe(501));
  it("sets the payment deadline to 12 hours",()=>expect(bookingExpiration(new Date("2026-08-30T01:00:00Z")).toISOString()).toBe("2026-08-30T13:00:00.000Z"));
  it("calculates Glamping quantity times nights",()=>expect(calculateGlampingPrice(850000,2,"2026-08-29","2026-08-31").totalAmount).toBe(3_400_000));
  it("calculates Jeep price per physical Jeep",()=>expect(calculateJeepPrice(750000,3).totalAmount).toBe(2_250_000));
  it("rejects an invalid accommodation range",()=>expect(()=>calculateNightCount("2026-08-30","2026-08-30")).toThrow(/after/));
  it("accepts the checkout boundary as a new range",()=>{expect(calculateNightCount("2026-08-29","2026-08-30")).toBe(1);expect(calculateNightCount("2026-08-30","2026-08-31")).toBe(1);});
  it("enforces aggregate guest capacity",()=>expect(()=>assertCapacity(5,2,2)).toThrow(/capacity/));
  it("rejects an invalid lifecycle transition",()=>expect(()=>validateBookingTransition("EXPIRED","CONFIRMED")).toThrow(/not allowed/));
  it("rejects a same-day Jeep departure that has already passed in Jakarta",()=>{
    const now=new Date("2026-08-27T00:30:00.000Z"); // 07:30 WIB
    expect(()=>assertJeepDepartureOpen("2026-08-27","03:00:00","Asia/Jakarta",now)).toThrow(/already passed/);
    expect(()=>assertJeepDepartureOpen("2026-08-27","08:00:00","Asia/Jakarta",now)).not.toThrow();
  });
});

describe("customer normalization",()=>{it("normalizes email and Indonesian WhatsApp",()=>{expect(normalizeEmail(" Demo@Example.TEST ")).toBe("demo@example.test");expect(normalizeWhatsApp("0812-3456-7890")).toBe("6281234567890");});});
