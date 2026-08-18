import { NextResponse } from "next/server";
import { MockStoreService } from "@/lib/providers/mock/mock.store";
import { AuthorizeNetService, HOSTED_URL } from "@/lib/services/authorizenet";
import { withOptionalAuth, OptionalAuthRequest } from "@/lib/utils/auth.middleware";
import { CartService } from "@/lib/services/cart.service";
import { z } from "zod";

const PaymentSessionSchema = z.object({
  amount: z.coerce.number().finite().positive(),
  billing: z.unknown().optional(),
});

export const POST = withOptionalAuth(async (req: OptionalAuthRequest) => {
  try {
    const { amount, billing } = PaymentSessionSchema.parse(await req.json());
    const cartToken = req.headers.get("Cart-Token");
    if (!cartToken) {
      return NextResponse.json({ success: false, message: "Cart-Token is required" }, { status: 400 });
    }
    const cart = await CartService.getCart(req.headers.get("Nonce") ?? "", cartToken);
    if (cart.isEmpty || Math.abs(cart.totals.total - amount) > 0.001) {
      return NextResponse.json({ success: false, message: "Payment amount does not match the current cart" }, { status: 422 });
    }

    if ((process.env.NEXT_PUBLIC_API_SOURCE ?? "MOCK").toUpperCase() === "SHOPIFY") {
      if (!cart.checkoutUrl) {
        return NextResponse.json({ success: false, message: "Shopify checkout is unavailable for this cart" }, { status: 422 });
      }
      return NextResponse.json({
        success: true,
        orderId: cart.cartToken,
        hostedPaymentUrl: cart.checkoutUrl,
        paymentToken: cart.cartToken,
      });
    }

    const orderId = MockStoreService.createOrder(amount);

    // Pass 'billing' to the service
    const token = await AuthorizeNetService.getHostedPaymentToken(orderId, amount, billing);

    return NextResponse.json({
      success: true,
      orderId,
      hostedPaymentUrl: "https://test.authorize.net/payment/payment",
      paymentToken: token,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
});
