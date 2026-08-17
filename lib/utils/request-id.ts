import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Request ID middleware
// Attaches a unique X-Request-ID to every response.
// If Flutter sends one, we echo it back. Otherwise we generate one.
// Use this ID in all console.error() calls so you can trace a Flutter
// bug report back to a specific BFF log line.
//
// Usage in a route:
//   const requestId = getRequestId(req);
//   console.error(`[/api/cart/add requestId=${requestId}]`, error.message);
// ---------------------------------------------------------------------------

export function getRequestId(req: NextRequest): string {
  return (
    req.headers.get("X-Request-ID") ??
    `bff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
}

export function attachRequestId(res: NextResponse, requestId: string): NextResponse {
  res.headers.set("X-Request-ID", requestId);
  return res;
}

// ---------------------------------------------------------------------------
// withRequestId — wraps any handler and ensures X-Request-ID flows through
//
// Usage:
//   export const POST = withRequestId(async (req, ctx, requestId) => {
//     console.log(`[route requestId=${requestId}]`);
//     ...
//   });
// ---------------------------------------------------------------------------

type HandlerWithId = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> },
  requestId: string,
) => Promise<NextResponse>;

export function withRequestId(handler: HandlerWithId) {
  return async (
    req: NextRequest,
    ctx: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    const requestId = getRequestId(req);
    const res       = await handler(req, ctx, requestId);
    return attachRequestId(res, requestId);
  };
}