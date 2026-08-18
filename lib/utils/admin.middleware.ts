import { NextRequest, NextResponse } from "next/server";

type AdminHandler = (req: NextRequest) => Promise<NextResponse>;

/**
 * Keeps the merchant-control surface closed in production without changing
 * its endpoint or response format. Local development remains usable unless an
 * explicit ADMIN_API_TOKEN is configured.
 */
export function withAdmin(handler: AdminHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const configuredToken = process.env.ADMIN_API_TOKEN;
    const presentedToken = req.headers.get("X-Admin-Token");
    const isLocalDevelopment = process.env.NODE_ENV !== "production" && !configuredToken;

    if (!isLocalDevelopment && (!configuredToken || presentedToken !== configuredToken)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    return handler(req);
  };
}
