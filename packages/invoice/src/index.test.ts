import { describe, expect, it } from "vitest";
import { invoicePaymentLabel } from "./index";

describe("invoice payment presentation", () => {
  it("keeps a DP invoice distinct from a fully-paid invoice", () => {
    expect(invoicePaymentLabel(500_000)).toBe("DP SUDAH DIBAYAR");
    expect(invoicePaymentLabel(0)).toBe("LUNAS");
  });
});
