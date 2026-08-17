// ============================================================
// app/api/auth/me/route.ts       ← NEW
// GET /api/auth/me
// Header: Authorization: Bearer <token>
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { UserSchema } from "@/lib/validations/user.schema";
 
export async function GET(req: NextRequest) {
  try {
    const auth  = req.headers.get("Authorization") ?? "";
    const token = auth.replace("Bearer ", "").trim();
    if (!token) return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 });
 
    const user          = await AuthService.getUser(token);
    const validatedUser = UserSchema.parse(user);
    return NextResponse.json({ success: true, user: validatedUser });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
}