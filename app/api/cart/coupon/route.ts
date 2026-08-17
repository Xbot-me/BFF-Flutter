// ============================================================
// app/api/cart/coupon/route.ts
// POST /api/cart/coupon  — apply
// DELETE /api/cart/coupon — remove
// Body: { code }
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { CartService } from "@/lib/services/cart.service";
 
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ success: false, error: "code is required" }, { status: 400 });
    const cartToken = req.headers.get("Cart-Token") ?? "";
    const nonce     = req.headers.get("Nonce") ?? "";
    const { cart, cartToken: newToken } = await CartService.applyCoupon(code, nonce, cartToken);
    const res = NextResponse.json({ success: true, cart });
    res.headers.set("Cart-Token", newToken);
    return res;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
 
export async function DELETE(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ success: false, error: "code is required" }, { status: 400 });
    const cartToken = req.headers.get("Cart-Token") ?? "";
    const nonce     = req.headers.get("Nonce") ?? "";
    const { cart, cartToken: newToken } = await CartService.removeCoupon(code, nonce, cartToken);
    const res = NextResponse.json({ success: true, cart });
    res.headers.set("Cart-Token", newToken);
    return res;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}