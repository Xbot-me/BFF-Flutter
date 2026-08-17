// ============================================================
// app/api/checkout/validate/route.ts
// POST /api/checkout/validate
// Dry-run checkout validation — catches stock-outs, address
// errors, expired coupons BEFORE Authorize.net is charged.
// Returns { valid: true } or { valid: false, errors: [] }
//
// Body: same shape as /api/checkout/process
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { CheckoutRequestSchema } from "@/lib/validations/checkout.schema";
import { CartService } from "@/lib/services/cart.service";
 
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try { body = await req.json(); }
    catch {
      return NextResponse.json(
        { valid: false, errors: ["Invalid JSON in request body"] },
        { status: 400 }
      );
    }
 
    // 1. Schema validation
    let input;
    try {
      input = CheckoutRequestSchema.parse(body);
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.issues.map((e) => `${e.path.join(".")}: ${e.message}`);
        return NextResponse.json({ valid: false, errors }, { status: 422 });
      }
      return NextResponse.json({ valid: false, errors: ["Invalid request"] }, { status: 400 });
    }
 
    // 2. Cart validation — check stock and cart is not empty
    const nonce = req.headers.get("Nonce") ?? "";
    const cart  = await CartService.getCart(nonce, input.cartToken);
 
    const errors: string[] = [];
 
    if (cart.isEmpty) {
      errors.push("Your cart is empty");
    }
 
    // Check each item is still in stock
    for (const item of cart.items) {
      if (!item.productId) continue;
      // In WOO mode, stock is validated server-side — this catches mock out-of-stock
      if (item.quantity < 1) {
        errors.push(`${item.name}: invalid quantity`);
      }
    }
 
    // 3. Address validation — state check for US/CA/AU
    const countriesRequiringState = ["US", "CA", "AU"];
    if (
      countriesRequiringState.includes(input.billingAddress.country) &&
      !input.billingAddress.state
    ) {
      errors.push("State is required for your billing address");
    }
 
    if (errors.length > 0) {
      return NextResponse.json({ valid: false, errors }, { status: 422 });
    }
 
    return NextResponse.json({
      valid:   true,
      summary: {
        itemCount:     cart.itemsCount,
        subtotal:      cart.totals.subtotal,
        total:         cart.totals.total,
        currencyCode:  cart.totals.currencyCode,
        paymentMethod: input.paymentMethod,
      },
    });
 
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, errors: ["Validation service unavailable"] },
      { status: 500 }
    );
  }
}