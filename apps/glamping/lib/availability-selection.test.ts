import { describe, expect, it } from "vitest";
import {
  inventoryForSelectedStay,
  selectedStayRange,
} from "./availability-selection";

const days = [
  {
    date: "2026-09-09",
    inventory: [
      { productSlug: "glamping-deluxe", availableUnits: 1 },
      { productSlug: "glamping-twin-bed", availableUnits: 1 },
    ],
  },
  {
    date: "2026-09-10",
    inventory: [
      { productSlug: "glamping-deluxe", availableUnits: 2 },
      { productSlug: "glamping-twin-bed", availableUnits: 4 },
    ],
  },
];

describe("availability selection", () => {
  it("keeps 9 September stock when 10 September is selected as checkout", () => {
    expect(selectedStayRange("2026-09-09", "2026-09-10")).toEqual({
      checkInDate: "2026-09-09",
      checkOutDate: "2026-09-10",
    });
    expect(
      inventoryForSelectedStay(days, "2026-09-09", [
        { slug: "glamping-deluxe", availableQuantity: 1 },
        { slug: "glamping-twin-bed", availableQuantity: 1 },
      ]),
    ).toEqual([
      { productSlug: "glamping-deluxe", availableUnits: 1 },
      { productSlug: "glamping-twin-bed", availableUnits: 1 },
    ]);
  });

  it("uses one night after check-in until an explicit checkout is selected", () => {
    expect(selectedStayRange("2026-09-09", "")).toEqual({
      checkInDate: "2026-09-09",
      checkOutDate: "2026-09-10",
    });
  });

  it("uses authoritative range availability instead of a checkout-day snapshot", () => {
    expect(
      inventoryForSelectedStay(days, "2026-09-09", [
        { slug: "glamping-deluxe", availableQuantity: 0 },
        { slug: "glamping-twin-bed", availableQuantity: 1 },
      ]),
    ).toEqual([
      { productSlug: "glamping-deluxe", availableUnits: 0 },
      { productSlug: "glamping-twin-bed", availableUnits: 1 },
    ]);
  });
});
