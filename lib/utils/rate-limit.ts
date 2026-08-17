import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// In-memory token bucket rate limiter.
// Resets on Next.js process restart (fine for dev/single-instance).
// For multi-instance production, replace the Map with Redis via Upstash:
//   https://github.com/upstash/ratelimit
// ---------------------------------------------------------------------------

interface Bucket {
  tokens:    number;
  lastRefill: number;  // timestamp ms
}

const buckets = new Map<string, Bucket>();

interface RateLimitConfig {
  limit:        number;  // max requests per window
  windowMs:     number;  // refill window in ms
  keyPrefix:    string;  // namespaces buckets per route
}

function getClientKey(req: NextRequest, prefix: string): string {
  // Use IP address as the bucket key
  const forwarded = req.headers.get("x-forwarded-for");
  const ip        = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `${prefix}:${ip}`;
}

function checkBucket(key: string, config: RateLimitConfig): {
  allowed:   boolean;
  remaining: number;
  resetMs:   number;
} {
  const now    = Date.now();
  const bucket = buckets.get(key) ?? { tokens: config.limit, lastRefill: now };

  // Refill tokens based on elapsed time
  const elapsed     = now - bucket.lastRefill;
  const refillCount = Math.floor((elapsed / config.windowMs) * config.limit);

  if (refillCount > 0) {
    bucket.tokens    = Math.min(config.limit, bucket.tokens + refillCount);
    bucket.lastRefill = now;
  }

  const allowed   = bucket.tokens > 0;
  const remaining = Math.max(0, bucket.tokens - 1);
  const resetMs   = bucket.lastRefill + config.windowMs;

  if (allowed) bucket.tokens--;
  buckets.set(key, bucket);

  return { allowed, remaining, resetMs };
}

// ---------------------------------------------------------------------------
// withRateLimit — route wrapper
//
// Usage:
//   export const GET = withRateLimit(handler, { limit: 30, windowMs: 60_000, keyPrefix: "search" });
// ---------------------------------------------------------------------------

type Handler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

export function withRateLimit(handler: Handler, config: RateLimitConfig) {
  return async (
    req: NextRequest,
    ctx: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    const key    = getClientKey(req, config.keyPrefix);
    const result = checkBucket(key, config);

    if (!result.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please slow down." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit":     String(config.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset":     String(result.resetMs),
            "Retry-After":           String(Math.ceil((result.resetMs - Date.now()) / 1000)),
          },
        }
      );
    }

    const res = await handler(req, ctx);

    // Attach rate limit headers to every response
    res.headers.set("X-RateLimit-Limit",     String(config.limit));
    res.headers.set("X-RateLimit-Remaining", String(result.remaining));
    res.headers.set("X-RateLimit-Reset",     String(result.resetMs));

    return res;
  };
}

// ---------------------------------------------------------------------------
// Pre-configured limiters for common routes
// ---------------------------------------------------------------------------

// Search — 30 requests per minute per IP
export const searchRateLimit: RateLimitConfig = {
  limit: 30, windowMs: 60_000, keyPrefix: "search",
};

// Auth (login/signup) — 10 attempts per 15 minutes per IP
export const authRateLimit: RateLimitConfig = {
  limit: 10, windowMs: 15 * 60_000, keyPrefix: "auth",
};

// Password reset — 5 attempts per hour per IP
export const passwordResetRateLimit: RateLimitConfig = {
  limit: 5, windowMs: 60 * 60_000, keyPrefix: "pwd-reset",
};

// General API — 120 requests per minute per IP
export const generalRateLimit: RateLimitConfig = {
  limit: 120, windowMs: 60_000, keyPrefix: "general",
};