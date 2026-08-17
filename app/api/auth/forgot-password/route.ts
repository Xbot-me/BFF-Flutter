// ============================================================
// app/api/auth/forgot-password/route.ts       ← NEW
// POST /api/auth/forgot-password
// Body: { email }
// Always returns 200 — never reveals if email exists
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/lib/services/auth.service";
import { withRateLimit, passwordResetRateLimit } from "@/lib/utils/rate-limit";
 
async function handler(req: NextRequest) {
  try {
    const { email } = await req.json();
 
    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }
 
    // Always returns success — never reveals if account exists
    await AuthService.forgotPassword(email.toLowerCase().trim());
 
    return NextResponse.json({
      success: true,
      message: "If an account exists for this email, a reset link has been sent.",
    });
  } catch {
    // Swallow errors — same response regardless
    return NextResponse.json({
      success: true,
      message: "If an account exists for this email, a reset link has been sent.",
    });
  }
}
 
export const POST = withRateLimit(handler, passwordResetRateLimit);