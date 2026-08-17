import { NextResponse } from "next/server";
import { withAuth, AuthedRequest } from "@/lib/utils/auth.middleware";
import { UserService } from "@/lib/services/user.service";

export const DELETE = withAuth(async (req: AuthedRequest) => {
  try {
    await UserService.deleteUser(req.user.id);
    return NextResponse.json({ success: true, message: "Account deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
});
