// ============================================================
// app/api/cart/merge/route.ts
// POST /api/cart/merge
// Merges a guest cart into an authenticated user's cart.
// Called immediately after login/signup when the user had items
// in their anonymous session.
//
// Body: { guestCartToken: "..." }
// Header: Authorization: Bearer <token>
//         Cart-Token: <user cart token> (optional — if user already has one)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { CartService } from "@/lib/services/cart.service";
import { withAuth, AuthedRequest } from "@/lib/utils/auth.middleware";
 
export const POST = withAuth(async (req: AuthedRequest) => {
  try {
    const { guestCartToken } = await req.json();
 
    if (!guestCartToken) {
      return NextResponse.json(
        { success: false, error: "guestCartToken is required" },
        { status: 400 }
      );
    }
 
    const userCartToken = req.headers.get("Cart-Token");
    const nonce         = req.headers.get("Nonce") ?? "";
 
    const cart = await CartService.mergeCarts(
      guestCartToken,
      userCartToken,
      nonce,
      req.user.id,
    );
 
    const res = NextResponse.json({ success: true, cart });
    res.headers.set("Cart-Token", cart.cartToken);
    return res;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});
 