import { NextRequest } from "next/server";

/** The same tenant selector accepted by /api/tenant-config. */
export function getTenantId(req: NextRequest): string | null {
  return req.headers.get("X-Tenant-Id") ?? req.nextUrl.searchParams.get("tenant");
}
