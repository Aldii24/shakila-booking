import { describe, expect, it } from "vitest";
import { evaluateManualPayment } from "./manual";

describe("manual transfer decision", () => {
  it("confirms only after the 50 percent DP threshold is satisfied", () => {
    expect(evaluateManualPayment({ currentVerified: 0, verifiedAmount: 499_999, requiredDp: 500_000, totalAmount: 1_000_000 }).confirmed).toBe(false);
    expect(evaluateManualPayment({ currentVerified: 0, verifiedAmount: 500_000, requiredDp: 500_000, totalAmount: 1_000_000 })).toMatchObject({ confirmed: true, paymentStatus: "PARTIALLY_PAID", remainingAmount: 500_000 });
  });

  it("accumulates approved proofs without exceeding the remaining balance", () => {
    expect(evaluateManualPayment({ currentVerified: 500_000, verifiedAmount: 500_000, requiredDp: 500_000, totalAmount: 1_000_000 })).toMatchObject({ newVerified: 1_000_000, paymentStatus: "PAID", remainingAmount: 0 });
  });
});
