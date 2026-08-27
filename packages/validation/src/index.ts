import { z } from "zod";

declare const process: {env: Record<string,string|undefined>};

export const bookingCodeSchema = z.string().trim().regex(/^(GLP|JEP)-\d{6}-\d{6}$/);
export const emailSchema = z.email().transform((value) => value.trim().toLowerCase());
export const whatsappSchema = z.string().trim().min(9).max(24).regex(/^\+?[0-9 ()-]+$/);
export const localDateSchema = z.iso.date();
export const positiveIntegerSchema = z.int().positive();
export const idrAmountSchema = z.int().nonnegative();

export const appModeSchema = z.enum(["demo", "production"]);
export const paymentProviderSchema = z.enum(["demo", "pakasir"]);
export const emailProviderSchema = z.enum(["preview", "resend"]);
export const invoiceStorageSchema = z.enum(["direct", "r2"]);
export const backgroundJobModeSchema = z.enum(["inline", "inngest"]);
export const turnstileModeSchema = z.enum(["disabled", "cloudflare"]);

export function getIntegrationMode() {
  const appMode = appModeSchema.parse(process.env.APP_MODE ?? "production");
  const demo = appMode === "demo";
  return {
    appMode,
    paymentProvider: paymentProviderSchema.parse(
      process.env.PAYMENT_PROVIDER ?? (demo ? "demo" : "pakasir"),
    ),
    emailProvider: emailProviderSchema.parse(
      process.env.EMAIL_PROVIDER ?? (demo ? "preview" : "resend"),
    ),
    invoiceStorage: invoiceStorageSchema.parse(
      process.env.INVOICE_STORAGE ?? (demo ? "direct" : "r2"),
    ),
    backgroundJobMode: backgroundJobModeSchema.parse(
      process.env.BACKGROUND_JOB_MODE ?? (demo ? "inline" : "inngest"),
    ),
    turnstileMode: turnstileModeSchema.parse(
      process.env.TURNSTILE_MODE ?? (demo ? "disabled" : "cloudflare"),
    ),
  } as const;
}

export function assertDemoMode(): void {
  if (getIntegrationMode().appMode !== "demo") {
    throw new Error("This operation is available only when APP_MODE=demo.");
  }
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  return digits;
}
