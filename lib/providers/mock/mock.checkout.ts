import { CheckoutRequest, CheckoutResponse } from "../../validations/checkout.schema";
import { MockCartProvider, getCartStore } from "./mock.cart";
import { MOCK_PRODUCTS } from "./mock.data";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const MOCK_FAILURE_RATE = 0.15;

const MOCK_FAILURE_SCENARIOS: CheckoutResponse[] = [
  {
    success: false,
    type:    "payment_error",
    message: "Payment declined by issuing bank",
  },
  {
    success: false,
    type:    "payment_error",
    message: "Insufficient funds",
  },
  {
    success: false,
    type:    "server_error",
    message: "Payment gateway timeout",
  },
];

export class MockCheckoutProvider {

  static async processCheckout(input: CheckoutRequest): Promise<CheckoutResponse> {
    await delay(1400);

    if (Math.random() < MOCK_FAILURE_RATE) {
      return MOCK_FAILURE_SCENARIOS[
        Math.floor(Math.random() * MOCK_FAILURE_SCENARIOS.length)
      ];
    }

    const cartStore = getCartStore();
    for (const item of cartStore.items) {
      const product = MOCK_PRODUCTS.find((p) => p.id === item.productId);
      if (!product) {
        return { success: false, type: "validation_error", message: `Product ${item.name} not found` };
      }
      if (product.stockStatus === "outofstock") {
        return { success: false, type: "validation_error", message: `${product.name} is out of stock` };
      }
      if (item.variantId) {
        const variant = product.variants?.find((v) => v.id === item.variantId);
        if (variant && variant.stockStatus === "outofstock") {
          return { success: false, type: "validation_error", message: `Selected variant for ${product.name} is out of stock` };
        }
      }
    }

    const orderId  = `MOCK-${Date.now()}`;
    const orderKey = `wc_order_${Math.random().toString(36).slice(2, 12)}`;

    // Clear the in-memory cart after successful order — mirrors real checkout behaviour
    MockCartProvider.resetCart();

    return {
      success:  true,
      type:     "success",
      orderId,
      orderKey,
      message:  "Order placed successfully",
      details: {
        paymentStatus:  "success",
        paymentMethod:  input.paymentMethod,
        billingName:    `${input.billingAddress.first_name} ${input.billingAddress.last_name}`,
        billingEmail:   input.billingAddress.email,
        shippingName:   `${input.shippingAddress.first_name} ${input.shippingAddress.last_name}`,
        redirectUrl:    `https://yourstore.com/order-received/${orderId}?key=${orderKey}`,
        isMock:         true,
      },
    };
  }
}