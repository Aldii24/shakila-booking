import { beforeEach, describe, expect, it } from "vitest";
import { clearLoginFailures, inspectLoginRateLimit, recordLoginFailure, resetLoginRateLimitsForTests } from "./login-rate-limit";

describe("admin login rate limiter", () => {
  beforeEach(resetLoginRateLimitsForTests);
  it("blocks a key after five failures and reports a retry time", () => {
    const key = "203.0.113.10:owner@example.test";
    for (let index = 0; index < 5; index += 1) recordLoginFailure(key, 1_000);
    expect(inspectLoginRateLimit(key, 1_001)).toEqual({ allowed: false, retryAfterSeconds: 900 });
  });
  it("clears failures after a successful login", () => {
    const key = "203.0.113.10:owner@example.test";
    recordLoginFailure(key, 1_000); clearLoginFailures(key);
    expect(inspectLoginRateLimit(key, 1_001).allowed).toBe(true);
  });
});
