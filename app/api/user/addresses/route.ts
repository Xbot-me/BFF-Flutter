// ============================================================
// app/api/user/addresses/route.ts              ← NEW
// GET  /api/user/addresses   — list addresses
// POST /api/user/addresses   — add new address
// ============================================================
import { NextResponse } from "next/server";
import { UserService } from "@/lib/services/user.service";
import { withAuth, AuthedRequest } from "@/lib/utils/auth.middleware";
 
export const GET = withAuth(async (req: AuthedRequest) => {
  return NextResponse.json({ success: true, addresses: req.user.addresses ?? [] });
});
 
export const POST = withAuth(async (req: AuthedRequest) => {
  try {
    const body    = await req.json();
    const address = await UserService.addAddress(req.user.id, body);
    return NextResponse.json({ success: true, address }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});
 