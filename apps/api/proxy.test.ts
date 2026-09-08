import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;

afterEach(() => {
  if (originalAllowedOrigins === undefined) {
    delete process.env.ALLOWED_ORIGINS;
  } else {
    process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
  }
});

describe("API CORS proxy", () => {
  it("accepts the production Glamping apex domain", () => {
    process.env.ALLOWED_ORIGINS = [
      "https://shakilagrup.com",
      "https://glamping.shakilagrup.com",
    ].join(",");

    const response = proxy(
      new NextRequest("https://api.shakilagrup.com/api/v1/public/glamping/calendar", {
        method: "OPTIONS",
        headers: { origin: "https://shakilagrup.com" },
      }),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "https://shakilagrup.com",
    );
  });

  it("continues to reject origins outside the allowlist", () => {
    process.env.ALLOWED_ORIGINS = "https://shakilagrup.com";

    const response = proxy(
      new NextRequest("https://api.shakilagrup.com/api/v1/public/glamping/calendar", {
        method: "OPTIONS",
        headers: { origin: "https://example.test" },
      }),
    );

    expect(response.status).toBe(403);
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
  });
});
