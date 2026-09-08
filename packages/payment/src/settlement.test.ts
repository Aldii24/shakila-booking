import { describe, expect, it } from "vitest";
import { evaluateManualSettlement } from "./settlement";

describe("manual admin settlement", () => {
  it("marks a booking paid only when the total is reached", () => {
    expect(evaluateManualSettlement({ currentVerified: 500_000, amount: 500_000, totalAmount: 1_000_000 })).toEqual({
      verifiedPaidAmount: 1_000_000,
      remainingAmount: 0,
      paymentStatus: "PAID",
    });
    expect(evaluateManualSettlement({ currentVerified: 500_000, amount: 200_000, totalAmount: 1_000_000 })).toMatchObject({
      verifiedPaidAmount: 700_000,
      remainingAmount: 300_000,
      paymentStatus: "PARTIALLY_PAID",
    });
  });

  it("rejects zero, overpayment, and already-paid attempts", () => {
    expect(() => evaluateManualSettlement({ currentVerified: 500_000, amount: 0, totalAmount: 1_000_000 })).toThrow();
    expect(() => evaluateManualSettlement({ currentVerified: 500_000, amount: 500_001, totalAmount: 1_000_000 })).toThrow();
    expect(() => evaluateManualSettlement({ currentVerified: 1_000_000, amount: 1, totalAmount: 1_000_000 })).toThrow();
  });
});
