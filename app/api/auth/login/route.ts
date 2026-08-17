// ============================================================
// app/api/auth/login/route.ts
// POST /api/auth/login
// Body: { email, password }
// ============================================================
import { NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { UserSchema } from "@/lib/validations/user.schema";
 
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password required" }, { status: 400 });
    }
    const { user, token } = await AuthService.login(email, password);
    const validatedUser   = UserSchema.parse(user);
    return NextResponse.json({ success: true, user: validatedUser, token });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 401 });
  }
}