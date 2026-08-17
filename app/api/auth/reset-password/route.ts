// ============================================================
// app/api/auth/reset-password/route.ts        ← NEW
// POST /api/auth/reset-password
// Body: { token, newPassword }
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { AuthService } from "@/lib/services/auth.service";
import { withRateLimit, passwordResetRateLimit } from "@/lib/utils/rate-limit";
 
const ResetSchema = z.object({
  token:       z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});
 
async function handler(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 }); }
 
  let input;
  try { input = ResetSchema.parse(body); }
  catch (err) {
    if (err instanceof ZodError) {
      const fields = err.issues.reduce<Record<string, string>>((acc, e) => {
        acc[e.path.join(".")] = e.message; return acc;
      }, {});
      return NextResponse.json({ success: false, error: "Validation failed", fields }, { status: 422 });
    }
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
 
  try {
    await AuthService.resetPassword(input.token, input.newPassword);
    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
 
export const POST = withRateLimit(handler, passwordResetRateLimit);