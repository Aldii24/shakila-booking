import { describe, expect, it } from "vitest";
import {
  bookingCreatedPushPayload,
  paymentProofPushPayload,
  shouldRemoveInvalidSubscription,
} from "./push";

describe("Admin Web Push payloads", () => {
  it("routes a new booking notification to its Admin detail", () => {
    expect(
      bookingCreatedPushPayload({
        bookingCode: "SHK-260909-0001",
        productName: "Glamping Deluxe",
        adminOrigin: "https://admin.example.test",
      }),
    ).toEqual({
      title: "Booking Baru",
      body: "Glamping Deluxe",
      url: "https://admin.example.test/bookings/SHK-260909-0001",
      tag: "booking-created-SHK-260909-0001",
    });
  });

  it("routes a payment proof notification to payment verification", () => {
    expect(
      paymentProofPushPayload({
        bookingCode: "SHK/unsafe",
        adminOrigin: "https://admin.example.test",
      }).url,
    ).toBe("https://admin.example.test/payments");
    expect(
      paymentProofPushPayload({ bookingCode: "SHK/unsafe" }).body,
    ).toBe("Booking SHK/unsafe");
  });
});

describe("invalid Web Push cleanup", () => {
  it("removes only provider-gone subscriptions", () => {
    expect(shouldRemoveInvalidSubscription({ statusCode: 404 })).toBe(true);
    expect(shouldRemoveInvalidSubscription({ statusCode: 410 })).toBe(true);
    expect(shouldRemoveInvalidSubscription({ statusCode: 429 })).toBe(false);
    expect(shouldRemoveInvalidSubscription(new Error("offline"))).toBe(false);
  });
});
