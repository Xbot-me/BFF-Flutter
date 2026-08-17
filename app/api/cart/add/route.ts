import { NextRequest, NextResponse } from "next/server";
import { CartService } from "@/lib/services/cart.service";

/**
 * POST /api/cart/add
 *
 * Simple product:
 *   { "productId": "1", "quantity": 1 }
 *
 * Variable product (recommended — send both):
 *   {
 *     "productId": "2",
 *     "quantity": 1,
 *     "variantId": "1436738",
 *     "selectedOptions": { "version": "HYUNGWON ver." }
 *   }
 *
 * Variable product (fallback — selectedOptions only):
 *   { "productId": "2", "quantity": 1, "selectedOptions": { "version": "HYUNGWON ver." } }
 *
 * Headers:
 *   Cart-Token: <token>   (omit on first add — BFF creates a new cart)
 *   Nonce: <nonce>        (required for WOO mode; safe to send empty in MOCK mode)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, quantity, selectedOptions, variantId } = body;

    if (!productId || !quantity) {
      return NextResponse.json(
        { success: false, error: "productId and quantity are required" },
        { status: 400 }
      );
    }

    if (typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json(
        { success: false, error: "quantity must be a positive number" },
        { status: 400 }
      );
    }

    const cartToken = req.headers.get("Cart-Token");
    const nonce     = req.headers.get("Nonce") ?? "";

    const { cart, cartToken: newToken } = await CartService.addItem(
      String(productId),
      quantity,
      nonce,
      cartToken,
      selectedOptions,   // Record<string, string> | undefined
      variantId          // string | undefined — variation post ID from Flutter
        ? String(variantId)
        : undefined,
    );

    const res = NextResponse.json({ success: true, cart });
    res.headers.set("Cart-Token", newToken);
    return res;

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}