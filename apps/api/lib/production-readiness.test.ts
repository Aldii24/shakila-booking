import { afterEach, describe, expect, it } from "vitest";
import { productionReadiness } from "./production-readiness";

const names = [
  "DATABASE_URL", "BOOKING_ACCESS_TOKEN_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET", "TURNSTILE_SECRET_KEY", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY", "R2_PAYMENT_PROOFS_BUCKET_NAME",
] as const;

afterEach(() => { for (const name of names) delete process.env[name]; delete process.env.APP_MODE; delete process.env.TURNSTILE_MODE; });

describe("production readiness", () => {
  it("fails closed when required security configuration is absent", () => {
    process.env.APP_MODE = "production";
    process.env.TURNSTILE_MODE = "disabled";
    const result = productionReadiness();
    expect(result.ready).toBe(false);
    expect(result.missing).toContain("ADMIN_EMAIL");
    expect(result.missing).toContain("TURNSTILE_MODE=cloudflare");
  });

  it("accepts a fully configured production security boundary", () => {
    process.env.APP_MODE = "production";
    process.env.TURNSTILE_MODE = "cloudflare";
    for (const name of names) process.env[name] = `${name}-configured-value-at-least-thirty-two-characters`;
    expect(productionReadiness().ready).toBe(true);
  });
});
