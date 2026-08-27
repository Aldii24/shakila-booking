import { createHmac, timingSafeEqual } from "node:crypto";
import { DomainError } from "./errors";

export type BookingTokenScope = "booking:read" | "invoice:read" | "payment:create";
type TokenPayload = { bookingId: string; bookingCode: string; scopes: BookingTokenScope[]; exp: number };

function sign(input: string, secret: string): string {
  return createHmac("sha256", secret).update(input).digest("base64url");
}

export function issueBookingAccessToken(payload: Omit<TokenPayload, "exp">, secret: string, lifetimeSeconds = 86_400): string {
  if (secret.length < 32) throw new Error("BOOKING_ACCESS_TOKEN_SECRET must contain at least 32 characters.");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + lifetimeSeconds })).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export function verifyBookingAccessToken(token: string, secret: string, bookingCode: string, requiredScope: BookingTokenScope): TokenPayload {
  const [body, signature] = token.split(".");
  if (!body || !signature) throw new DomainError("UNAUTHORIZED", "Invalid booking access token.", 401);
  const expected = sign(body, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new DomainError("UNAUTHORIZED", "Invalid booking access token.", 401);
  }
  let payload: TokenPayload;
  try { payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload; }
  catch { throw new DomainError("UNAUTHORIZED", "Invalid booking access token.", 401); }
  if (payload.exp <= Math.floor(Date.now() / 1000) || payload.bookingCode !== bookingCode || !payload.scopes.includes(requiredScope)) {
    throw new DomainError("UNAUTHORIZED", "Booking access token is expired or out of scope.", 401);
  }
  return payload;
}
