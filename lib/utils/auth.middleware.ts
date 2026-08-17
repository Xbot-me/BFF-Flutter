import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../services/auth.service";
import { AppUser } from "../models/user";

// ---------------------------------------------------------------------------
// Augmented request type — carries the resolved user after auth check
// ---------------------------------------------------------------------------

export interface AuthedRequest extends NextRequest {
  user: AppUser;
}

type RouteHandler = (
  req: AuthedRequest,
  ctx: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

// ---------------------------------------------------------------------------
// withAuth
// Wraps a route handler and enforces Bearer token authentication.
// On success, attaches the resolved AppUser to req.user.
// On failure, returns a clean 401 before the handler is ever called.
//
// Usage:
//   export const GET = withAuth(async (req, ctx) => {
//     const user = req.user;
//     ...
//   });
// ---------------------------------------------------------------------------

export function withAuth(handler: RouteHandler) {
  return async (
    req: NextRequest,
    ctx: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    const auth  = req.headers.get("Authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    let user: AppUser;
    try {
      user = await AuthService.getUser(token);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Attach user to request object so handler can access it
    (req as AuthedRequest).user = user;

    return handler(req as AuthedRequest, ctx);
  };
}

// ---------------------------------------------------------------------------
// withOptionalAuth
// Same as withAuth but does NOT reject unauthenticated requests.
// req.user will be undefined if no valid token is present.
// Used for routes that behave differently for logged-in users
// (e.g. product detail could show member-only prices).
// ---------------------------------------------------------------------------

export interface OptionalAuthRequest extends NextRequest {
  user?: AppUser;
}

type OptionalRouteHandler = (
  req: OptionalAuthRequest,
  ctx: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

export function withOptionalAuth(handler: OptionalRouteHandler) {
  return async (
    req: NextRequest,
    ctx: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    const auth  = req.headers.get("Authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();

    if (token) {
      try {
        const user = await AuthService.getUser(token);
        (req as OptionalAuthRequest).user = user;
      } catch {
        // Token present but invalid — proceed as guest
      }
    }

    return handler(req as OptionalAuthRequest, ctx);
  };
}