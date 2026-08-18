import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Generate or forward Request ID
  const requestId = request.headers.get("X-Request-Id") || crypto.randomUUID();

  // Handle preflight OPTIONS requests for CORS
  if (request.method === "OPTIONS") {
    const preflightHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Tenant-Id, Cart-Token, X-Idempotency-Key, X-Request-Id, Accept, Origin",
      "Access-Control-Max-Age": "86400",
      "X-Request-Id": requestId,
    };
    return new NextResponse(null, { status: 204, headers: preflightHeaders });
  }

  // Clone headers to pass down request ID and security tracing
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("X-Request-Id", requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Attach standard API headers to outgoing response
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Tenant-Id, Cart-Token, X-Idempotency-Key, X-Request-Id, Accept, Origin"
  );
  response.headers.set("X-Request-Id", requestId);

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
