import { prepareConfirmationEmail } from "@booking/email";
import { prepareInvoice } from "@booking/invoice";
import { getIntegrationMode } from "@booking/validation";

export async function completePostPayment(bookingId: string) {
  const mode = getIntegrationMode();
  if (mode.backgroundJobMode !== "inline") return {mode:"async" as const,invoice:"queued" as const,email:"queued" as const};
  if (mode.appMode !== "demo") throw new Error("Inline post-payment requires APP_MODE=demo.");
  let invoice: "ready" | "failed" = "ready";
  let email: "preview" | "failed" = "preview";
  try { await prepareInvoice(bookingId); } catch (error) {
    invoice = "failed";
    console.error("Demo invoice generation failed", error instanceof Error ? error.message : "Unknown error");
  }
  try { await prepareConfirmationEmail(bookingId); } catch (error) {
    email = "failed";
    console.error("Demo email preview failed", error instanceof Error ? error.message : "Unknown error");
  }
  return {mode:"inline" as const,invoice,email};
}
