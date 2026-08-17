// ============================================================
// app/api/cart/route.ts
// GET /api/cart
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { CartService } from "@/lib/services/cart.service";
 
export async function GET(req: NextRequest) {
  try {
    const cartToken = req.headers.get("Cart-Token");
    const nonce     = req.headers.get("Nonce") ?? "";
    const cart      = await CartService.getCart(nonce, cartToken);
    const res       = NextResponse.json({ success: true, cart });
    if (cart.cartToken) res.headers.set("Cart-Token", cart.cartToken);
    return res;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cartToken = req.headers.get("Cart-Token");
    const cart      = await CartService.clearCart(cartToken);
    const res       = NextResponse.json({ success: true, cart });
    if (cart.cartToken) res.headers.set("Cart-Token", cart.cartToken);
    return res;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}