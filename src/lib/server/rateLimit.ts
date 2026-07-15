import "server-only";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalRateLimitStore = globalThis as typeof globalThis & {
  __hirevifyRateLimits?: Map<string, RateLimitEntry>;
};

const store =
  globalRateLimitStore.__hirevifyRateLimits ??
  (globalRateLimitStore.__hirevifyRateLimits = new Map<string, RateLimitEntry>());

export function getRequestIp(request: Request) {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function checkRateLimit(key: string, options: RateLimitOptions) {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + options.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: options.limit - 1, resetAt };
  }

  if (current.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  store.set(key, current);
  return {
    allowed: true,
    remaining: Math.max(0, options.limit - current.count),
    resetAt: current.resetAt,
  };
}

export function rateLimitHeaders(result: ReturnType<typeof checkRateLimit>) {
  return {
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
