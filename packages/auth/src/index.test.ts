import { beforeEach, describe, expect, it } from "vitest";
import {
  createDemoAdminSession,
  demoAdminCredentials,
  verifyDemoAdminCredentials,
  verifyDemoAdminSession,
} from "./index.js";

describe("explicit demo admin auth", () => {
  beforeEach(() => {
    process.env.APP_MODE = "demo";
    process.env.BOOKING_ACCESS_TOKEN_SECRET = "test-secret-at-least-local";
    process.env.DEMO_ADMIN_EMAIL = "demo@example.test";
    process.env.DEMO_ADMIN_PASSWORD = "correct-password";
  });

  it("accepts configured credentials and rejects incorrect passwords", () => {
    expect(verifyDemoAdminCredentials("DEMO@example.test", "correct-password")).toBe(true);
    expect(verifyDemoAdminCredentials("demo@example.test", "wrong-password")).toBe(false);
  });

  it("uses the documented fallback only in demo mode", () => {
    delete process.env.DEMO_ADMIN_EMAIL;
    delete process.env.DEMO_ADMIN_PASSWORD;
    expect(demoAdminCredentials()).toEqual({
      email: "admin@shakilagroup.demo",
      password: "demo12345",
    });
    process.env.APP_MODE = "production";
    expect(() => demoAdminCredentials()).toThrow(/APP_MODE=demo/);
  });

  it("signs and validates an expiring session", () => {
    const token = createDemoAdminSession("demo@example.test", 60);
    expect(verifyDemoAdminSession(token)?.role).toBe("OWNER");
    expect(verifyDemoAdminSession(`${token}tampered`)).toBeNull();
  });
});
