const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

type Attempt = { failures: number[]; blockedUntil: number };
const attempts = new Map<string, Attempt>();

function clientIp(request: Request) {
  return request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

export function loginRateLimitKey(request: Request, email: string) {
  return `${clientIp(request)}:${email.trim().toLowerCase()}`;
}

export function inspectLoginRateLimit(key: string, now = Date.now()) {
  const attempt = attempts.get(key);
  if (!attempt) return { allowed: true as const, retryAfterSeconds: 0 };
  if (attempt.blockedUntil > now)
    return { allowed: false as const, retryAfterSeconds: Math.max(1, Math.ceil((attempt.blockedUntil - now) / 1000)) };
  attempt.failures = attempt.failures.filter((value) => value > now - WINDOW_MS);
  if (!attempt.failures.length) attempts.delete(key);
  return { allowed: true as const, retryAfterSeconds: 0 };
}

export function recordLoginFailure(key: string, now = Date.now()) {
  if (!attempts.has(key) && attempts.size >= 10_000) {
    const oldestKey = attempts.keys().next().value as string | undefined;
    if (oldestKey) attempts.delete(oldestKey);
  }
  const attempt = attempts.get(key) ?? { failures: [], blockedUntil: 0 };
  attempt.failures = attempt.failures.filter((value) => value > now - WINDOW_MS);
  attempt.failures.push(now);
  if (attempt.failures.length >= MAX_FAILURES) attempt.blockedUntil = now + BLOCK_MS;
  attempts.set(key, attempt);
  return inspectLoginRateLimit(key, now);
}

export function clearLoginFailures(key: string) { attempts.delete(key); }
export function resetLoginRateLimitsForTests() { attempts.clear(); }
