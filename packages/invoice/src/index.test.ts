import { describe, expect, it } from "vitest";
import { invoiceBusinessLine, invoicePaymentLabel, renderInvoicePdf, type InvoiceSnapshot } from "./index";

const invoice = (remaining: number): InvoiceSnapshot => ({
  invoiceId: "invoice-id", invoiceNumber: "INV-TEST-001", status: "PENDING", bookingCode: "GLP-TEST-001",
  businessName: "Shakila Glamping", businessSlug: "glamping", customerName: "Tamu Shakila",
  customerEmail: "tamu@example.test", customerWhatsapp: "081234567890", bookingType: "ACCOMMODATION",
  productName: "Deluxe", startDate: "2099-01-02", endDate: "2099-01-03", departureTime: null,
  quantity: 1, guestCount: 2, unitPrice: 550_000, subtotal: 550_000, total: 550_000,
  dpPercentage: 50, paid: 550_000 - remaining, remaining, paymentStatus: remaining > 0 ? "PARTIALLY_PAID" : "PAID",
  issuedAt: "2099-01-01T10:00:00+07:00", r2ObjectKey: null, fileName: null,
});

describe("invoice payment presentation", () => {
  it("keeps a DP invoice distinct from a fully-paid invoice", () => {
    expect(invoicePaymentLabel(500_000)).toBe("DP TERBAYAR");
    expect(invoicePaymentLabel(0)).toBe("LUNAS");
  });

  it.each([{ remaining: 275_000, label: "DP" }, { remaining: 0, label: "LUNAS" }] as const)("renders a valid $label invoice PDF", async ({ remaining }) => {
    const bytes = await renderInvoicePdf(invoice(remaining));
    expect(new TextDecoder().decode(bytes.slice(0, 8))).toContain("%PDF-");
    expect(bytes.length).toBeGreaterThan(1_000);
  });

  it("uses only client business identity in the invoice header", () => {
    expect(invoiceBusinessLine("glamping")).toBe("G L A M P I N G   &   H O M E S T A Y");
    expect(invoiceBusinessLine("jeep")).toBe("T O U R   J E E P");
    expect(invoiceBusinessLine("glamping").toLowerCase()).not.toContain("bromo");
    expect(invoiceBusinessLine("jeep").toLowerCase()).not.toContain("bromo");
  });
});
