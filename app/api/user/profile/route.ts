// ============================================================
// app/api/user/profile/route.ts                ← REPLACE
// GET  /api/user/profile   — get profile
// PUT  /api/user/profile   — update name/phone/displayName
// ============================================================
import { NextResponse } from "next/server";
import { UserService } from "@/lib/services/user.service";
import { UserSchema } from "@/lib/validations/user.schema";
import { withAuth, AuthedRequest } from "@/lib/utils/auth.middleware";
 
export const GET = withAuth(async (req: AuthedRequest) => {
  const validated = UserSchema.parse(req.user);
  return NextResponse.json({ success: true, user: validated });
});
 
export const PUT = withAuth(async (req: AuthedRequest) => {
  try {
    const body    = await req.json();
    const updates = {
      firstName:   body.firstName,
      lastName:    body.lastName,
      phone:       body.phone,
      displayName: body.displayName,
    };
    const token      = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    const updated    = await UserService.updateProfile(req.user.id, updates, token);
    const validated  = UserSchema.parse(updated);
    return NextResponse.json({ success: true, user: validated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});