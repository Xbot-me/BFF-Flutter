// ============================================================
// lib/services/payment.service.ts  (updated to use MockCheckoutProvider)
// ============================================================
 
import { CheckoutRequest, CheckoutResponse } from "../validations/checkout.schema";
import { MockCheckoutProvider } from "../providers/mock/mock.checkout";
import { ShopifyStorefrontProvider } from "../providers/shopify/shopify.storefront";
 

type P = "MOCK" | "SHOPIFY";
const getProvider = (): P => (process.env.NEXT_PUBLIC_API_SOURCE ?? "MOCK") as P;

export class PaymentService {
  static async processCheckout(input: CheckoutRequest): Promise<CheckoutResponse> {
    switch (getProvider()) {

      case "SHOPIFY": {
        // Shopify owns payment authorization and order creation. The BFF must
        // hand the mobile app the cart checkout URL instead of accepting card
        // data or fabricating an order before payment succeeds.
        const cart = await ShopifyStorefrontProvider.getCart(input.cartToken);
        if (cart.isEmpty || !cart.checkoutUrl) throw new Error("A non-empty Shopify cart is required for checkout");
        return {
          success: true,
          type: "success",
          message: "Continue to Shopify secure checkout",
          details: { checkoutUrl: cart.checkoutUrl, paymentStatus: "pending" },
        };
      }
      default: return MockCheckoutProvider.processCheckout(input);
    }
  }
}
