 // ============================================================
// app/api/auth/logout/route.ts   ← NEW
// POST /api/auth/logout
// Header: Authorization: Bearer <token>
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
 
export async function POST(req: NextRequest) {
  try {
    const auth  = req.headers.get("Authorization") ?? "";
    const token = auth.replace("Bearer ", "").trim();
    await AuthService.logout(token);
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}