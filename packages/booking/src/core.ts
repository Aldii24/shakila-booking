import type { BookingStatus } from "@booking/contracts";
import { DomainError } from "./errors";

const DAY_MS = 86_400_000;
export const PAYMENT_DEADLINE_MINUTES = 12 * 60;

export function bookingExpiration(now = new Date(), minutes = PAYMENT_DEADLINE_MINUTES): Date {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > PAYMENT_DEADLINE_MINUTES)
    throw new DomainError("VALIDATION_ERROR", "Payment deadline must be between 1 minute and 12 hours.");
  return new Date(now.getTime() + minutes * 60_000);
}

export function calculateDp(totalAmount: number, dpPercentage: number): number {
  if (!Number.isSafeInteger(totalAmount) || totalAmount < 0 || !Number.isInteger(dpPercentage) || dpPercentage < 0 || dpPercentage > 100) {
    throw new DomainError("INVALID_QUANTITY", "Invalid amount or DP percentage.");
  }
  return Math.ceil((totalAmount * dpPercentage) / 100);
}

export function calculateNightCount(checkInDate: string, checkOutDate: string): number {
  const checkIn = Date.parse(`${checkInDate}T00:00:00Z`);
  const checkOut = Date.parse(`${checkOutDate}T00:00:00Z`);
  const nights = (checkOut - checkIn) / DAY_MS;
  if (!Number.isInteger(nights) || nights < 1) throw new DomainError("INVALID_DATE_RANGE", "Check-out date must be after check-in date.");
  return nights;
}

export function calculateGlampingPrice(unitPrice: number, quantity: number, checkInDate: string, checkOutDate: string) {
  if (!Number.isSafeInteger(unitPrice) || unitPrice < 0 || !Number.isInteger(quantity) || quantity < 1) {
    throw new DomainError("INVALID_QUANTITY", "Quantity must be a positive integer.");
  }
  const nightCount = calculateNightCount(checkInDate, checkOutDate);
  return { unitPrice, quantity, nightCount, subtotalAmount: unitPrice * quantity * nightCount, additionalAmount: 0, totalAmount: unitPrice * quantity * nightCount };
}

export function calculateJeepPrice(unitPrice: number, quantity: number) {
  if (!Number.isSafeInteger(unitPrice) || unitPrice < 0 || !Number.isInteger(quantity) || quantity < 1) {
    throw new DomainError("INVALID_QUANTITY", "Quantity must be a positive integer.");
  }
  return { unitPrice, quantity, subtotalAmount: unitPrice * quantity, additionalAmount: 0, totalAmount: unitPrice * quantity };
}

const transitions: Record<BookingStatus, readonly BookingStatus[]> = {
  PENDING: ["WAITING_PAYMENT"], WAITING_PAYMENT: ["CONFIRMED", "EXPIRED", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED"], CHECKED_IN: ["CHECKED_OUT"], CHECKED_OUT: ["COMPLETED"],
  COMPLETED: [], CANCELLED: [], EXPIRED: [],
};

export function validateBookingTransition(from: BookingStatus, to: BookingStatus): void {
  if (!transitions[from].includes(to)) throw new DomainError("BOOKING_STATE_CONFLICT", `Transition ${from} to ${to} is not allowed.`, 409);
}

export function businessDate(timezone = "Asia/Jakarta", instant = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(instant);
}

export function assertNotPast(date: string, timezone = "Asia/Jakarta", now = new Date()): void {
  if (date < businessDate(timezone, now)) throw new DomainError("INVALID_DATE_RANGE", "Reservation date cannot be in the past.");
}

export function assertJeepDepartureOpen(
  tourDate: string,
  departureTime: string,
  timezone = "Asia/Jakarta",
  now = new Date(),
): void {
  assertNotPast(tourDate, timezone, now);
  if (tourDate !== businessDate(timezone, now)) return;

  const time = /^(\d{2}):(\d{2})(?::(\d{2}))?/.exec(departureTime);
  if (!time) {
    throw new DomainError("INVALID_DEPARTURE_SLOT", "Departure time is invalid.");
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const currentSeconds = value("hour") * 3600 + value("minute") * 60 + value("second");
  const departureSeconds = Number(time[1]) * 3600 + Number(time[2]) * 60 + Number(time[3] ?? 0);

  if (currentSeconds >= departureSeconds) {
    throw new DomainError(
      "DEPARTURE_SLOT_CLOSED",
      "The selected departure time has already passed in the business timezone.",
      409,
    );
  }
}
