import { getIntegrationMode } from "@booking/validation";

const requiredProductionVariables = [
  "DATABASE_URL",
  "BOOKING_ACCESS_TOKEN_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
  "TURNSTILE_SECRET_KEY",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_PAYMENT_PROOFS_BUCKET_NAME",
] as const;

export function productionReadiness() {
  const mode = getIntegrationMode();
  if (mode.appMode !== "production") return { ready: true as const, mode: "demo" as const, missing: [] as string[] };
  const missing: string[] = requiredProductionVariables.filter((name) => !process.env[name]?.trim());
  if ((process.env.BOOKING_ACCESS_TOKEN_SECRET?.length ?? 0) < 32) missing.push("BOOKING_ACCESS_TOKEN_SECRET>=32");
  if ((process.env.ADMIN_SESSION_SECRET?.length ?? 0) < 32) missing.push("ADMIN_SESSION_SECRET>=32");
  if ((process.env.ADMIN_PASSWORD?.length ?? 0) < 12) missing.push("ADMIN_PASSWORD>=12");
  if (mode.turnstileMode !== "cloudflare") missing.push("TURNSTILE_MODE=cloudflare");
  return { ready: missing.length === 0, mode: "production" as const, missing: [...missing] };
}
