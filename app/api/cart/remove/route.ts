// ============================================================
// app/api/cart/remove/route.ts
// POST /api/cart/remove
// Body: { key }
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { CartService } from "@/lib/services/cart.service";
 
export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();
    if (!key) return NextResponse.json({ success: false, error: "key is required" }, { status: 400 });
    const cartToken = req.headers.get("Cart-Token") ?? "";
    const nonce     = req.headers.get("Nonce") ?? "";
    const { cart, cartToken: newToken } = await CartService.removeItem(key, nonce, cartToken);
    const res = NextResponse.json({ success: true, cart });
    res.headers.set("Cart-Token", newToken);
    return res;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}