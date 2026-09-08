import { beforeEach, describe, expect, it } from "vitest";
import { adminCredentials, createAdminSession, verifyAdminCredentials, verifyAdminSession } from "./index.js";

describe("admin authentication", () => {
  beforeEach(() => {
    process.env.APP_MODE = "production";
    process.env.ADMIN_EMAIL = "owner@example.test";
    process.env.ADMIN_PASSWORD = "correct-production-password";
    process.env.ADMIN_SESSION_SECRET = "test-admin-session-secret-at-least-32-characters";
  });

  it("accepts only production credentials supplied through the environment", () => {
    expect(verifyAdminCredentials("OWNER@example.test", "correct-production-password")).toBe(true);
    expect(verifyAdminCredentials("owner@example.test", "wrong-password")).toBe(false);
  });

  it("fails closed when production credentials are absent", () => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    expect(() => adminCredentials()).toThrow(/required in production/);
  });

  it("does not accept demo credentials in production", () => {
    process.env.DEMO_ADMIN_EMAIL = "demo@example.test";
    process.env.DEMO_ADMIN_PASSWORD = "demo-password";
    expect(verifyAdminCredentials("demo@example.test", "demo-password")).toBe(false);
  });

  it("signs and validates an expiring session", () => {
    const token = createAdminSession("owner@example.test", 60);
    expect(verifyAdminSession(token)?.role).toBe("OWNER");
    expect(verifyAdminSession(`${token}tampered`)).toBeNull();
  });
});
