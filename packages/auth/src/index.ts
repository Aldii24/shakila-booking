import { createHmac, timingSafeEqual } from "node:crypto";
import { getIntegrationMode } from "@booking/validation";

export const ADMIN_SESSION_COOKIE = "booking_admin_session";
export type AdminSession = {
  email: string;
  name: string;
  role: "OWNER";
  expiresAt: number;
};

const encode = (value: string) => Buffer.from(value).toString("base64url");
const equal = (actual: string, expected: string) => {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
};

function sessionSecret() {
  const production = getIntegrationMode().appMode === "production";
  const value = production
    ? process.env.ADMIN_SESSION_SECRET
    : process.env.ADMIN_SESSION_SECRET ?? process.env.BOOKING_ACCESS_TOKEN_SECRET;
  if (!value || value.length < 32)
    throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  return value;
}

const sign = (payload: string) => createHmac("sha256", sessionSecret()).update(payload).digest("base64url");

export function adminCredentials() {
  const production = getIntegrationMode().appMode === "production";
  const email = production
    ? process.env.ADMIN_EMAIL?.trim().toLowerCase()
    : process.env.DEMO_ADMIN_EMAIL?.trim().toLowerCase();
  const password = production
    ? process.env.ADMIN_PASSWORD
    : process.env.DEMO_ADMIN_PASSWORD;
  if (!email || !password)
    throw new Error(production
      ? "ADMIN_EMAIL and ADMIN_PASSWORD are required in production."
      : "Admin credentials are not configured.");
  return { email, password };
}

export function verifyAdminCredentials(email: string, password: string) {
  const expected = adminCredentials();
  return equal(email.trim().toLowerCase(), expected.email) && equal(password, expected.password);
}

export function createAdminSession(email: string, ttlSeconds = 8 * 60 * 60) {
  const session: AdminSession = {
    email: email.trim().toLowerCase(), name: "Administrator", role: "OWNER",
    expiresAt: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const payload = encode(JSON.stringify(session));
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSession(token: string | undefined | null): AdminSession | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !equal(signature, sign(payload))) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (value.role !== "OWNER" || value.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return value;
  } catch { return null; }
}
