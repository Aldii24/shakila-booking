import { describe, expect, it } from "vitest";
import {
  inventoryForSelectedStay,
  selectedStayRange,
} from "./availability-selection";

const days = [
  {
    date: "2026-09-27",
    inventory: [
      { productSlug: "glamping-deluxe", availableUnits: 2 },
      { productSlug: "glamping-twin-bed", availableUnits: 4 },
    ],
  },
  {
    date: "2026-09-28",
    inventory: [
      { productSlug: "glamping-deluxe", availableUnits: 2 },
      { productSlug: "glamping-twin-bed", availableUnits: 4 },
    ],
  },
  {
    date: "2026-09-29",
    inventory: [
      { productSlug: "glamping-deluxe", availableUnits: 0 },
      { productSlug: "glamping-twin-bed", availableUnits: 0 },
    ],
  },
  {
    date: "2026-10-15",
    inventory: [
      { productSlug: "glamping-deluxe", availableUnits: 0 },
      { productSlug: "glamping-twin-bed", availableUnits: 0 },
    ],
  },
];

describe("availability selection", () => {
  it("uses only the check-in night when checkout is not explicit", () => {
    expect(selectedStayRange("2026-09-27", "")).toEqual({
      checkInDate: "2026-09-27",
      checkOutDate: "2026-09-28",
    });
    expect(
      inventoryForSelectedStay(days, "2026-09-27", "", null),
    ).toEqual([
      { productSlug: "glamping-deluxe", availableUnits: 2 },
      { productSlug: "glamping-twin-bed", availableUnits: 4 },
    ]);
  });

  it("does not consume inventory on the checkout date", () => {
    expect(
      inventoryForSelectedStay(days, "2026-09-27", "2026-09-29", null),
    ).toEqual([
      { productSlug: "glamping-deluxe", availableUnits: 2 },
      { productSlug: "glamping-twin-bed", availableUnits: 4 },
    ]);
  });

  it("keeps a booking beginning on checkout date out of the previous stay", () => {
    expect(
      inventoryForSelectedStay(days, "2026-09-27", "2026-09-29", [
        { slug: "glamping-deluxe", availableQuantity: 2 },
        { slug: "glamping-twin-bed", availableQuantity: 4 },
      ]),
    ).toEqual([
      { productSlug: "glamping-deluxe", availableUnits: 2 },
      { productSlug: "glamping-twin-bed", availableUnits: 4 },
    ]);
  });

  it("ignores a full calendar day after the selected stay", () => {
    expect(
      inventoryForSelectedStay(days, "2026-09-27", "2026-09-29", null),
    ).toEqual([
      { productSlug: "glamping-deluxe", availableUnits: 2 },
      { productSlug: "glamping-twin-bed", availableUnits: 4 },
    ]);
  });

  it("uses authoritative selected-range availability over unrelated calendar days", () => {
    expect(
      inventoryForSelectedStay(days, "2026-09-27", "2026-09-29", [
        { slug: "glamping-deluxe", availableQuantity: 2 },
        { slug: "glamping-twin-bed", availableQuantity: 4 },
      ]),
    ).toEqual([
      { productSlug: "glamping-deluxe", availableUnits: 2 },
      { productSlug: "glamping-twin-bed", availableUnits: 4 },
    ]);
  });

  it("does not let a lower calendar value clamp authoritative availability", () => {
    const calendarDays = [
      {
        date: "2026-09-27",
        inventory: [
          { productSlug: "glamping-deluxe", availableUnits: 0 },
          { productSlug: "glamping-twin-bed", availableUnits: 0 },
        ],
      },
      {
        date: "2026-09-28",
        inventory: [
          { productSlug: "glamping-deluxe", availableUnits: 0 },
          { productSlug: "glamping-twin-bed", availableUnits: 0 },
        ],
      },
    ];

    expect(
      inventoryForSelectedStay(calendarDays, "2026-09-27", "2026-09-29", [
        { slug: "glamping-deluxe", availableQuantity: 2 },
        { slug: "glamping-twin-bed", availableQuantity: 4 },
      ]),
    ).toEqual([
      { productSlug: "glamping-deluxe", availableUnits: 2 },
      { productSlug: "glamping-twin-bed", availableUnits: 4 },
    ]);
  });
});
