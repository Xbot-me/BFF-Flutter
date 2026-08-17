// ============================================================
// app/api/user/rewards/route.ts                ← NEW
// GET /api/user/rewards
// ============================================================
import { NextResponse } from "next/server";
import { UserService } from "@/lib/services/user.service";
import { withAuth, AuthedRequest } from "@/lib/utils/auth.middleware";
 
export const GET = withAuth(async (req: AuthedRequest) => {
  try {
    const rewards = await UserService.getRewards(req.user.id);
    return NextResponse.json({ success: true, ...rewards });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});