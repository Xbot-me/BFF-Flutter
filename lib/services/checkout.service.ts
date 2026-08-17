import type { CheckoutRequest, CheckoutResponse } from "../validations/checkout.schema";



// ---------------------------------------------------------------------------
// Mock provider — simulates real-world failure scenarios for Flutter UI dev
// ---------------------------------------------------------------------------

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

async function processMockCheckout(input: CheckoutRequest): Promise<CheckoutResponse> {
  await new Promise((res) => setTimeout(res, 1200));

  if (Math.random() < MOCK_FAILURE_RATE) {
    const scenario = MOCK_FAILURE_SCENARIOS[
      Math.floor(Math.random() * MOCK_FAILURE_SCENARIOS.length)
    ];
    return scenario;
  }

  const mockOrderId  = `MOCK-${Date.now()}`;
  const mockOrderKey = `wc_order_${Math.random().toString(36).slice(2, 12)}`;

  return {
    success:  true,
    type:     "success",
    orderId:  mockOrderId,
    orderKey: mockOrderKey,
    message:  "Mock order placed successfully",
    details: {
      paymentStatus: "success",
      redirectUrl:   `https://yourstore.com/order-received/${mockOrderId}?key=${mockOrderKey}`,
      billingName:   `${input.billingAddress.first_name} ${input.billingAddress.last_name}`,
      isMock:        true,
    },
  };
}

// ---------------------------------------------------------------------------
// Shopify provider stub
// ---------------------------------------------------------------------------

// async function processShopifyCheckout(input: CheckoutRequest): Promise<CheckoutResponse> {
//   Shopify Storefront API:
//   1. checkoutCreate mutation
//   2. checkoutShippingAddressUpdateV2 mutation
//   3. checkoutCompleteWithTokenizedPaymentV3 mutation
//   throw new Error("Shopify checkout provider not implemented yet");
// }

// ---------------------------------------------------------------------------
// PaymentService — public interface, provider-agnostic
// ---------------------------------------------------------------------------

type ProviderType = "MOCK" | "SHOPIFY";

export class PaymentService {
  private static getProvider(): ProviderType {
    return (process.env.NEXT_PUBLIC_API_SOURCE ?? "MOCK") as ProviderType;
  }

  static async processCheckout(input: CheckoutRequest): Promise<CheckoutResponse> {
    const provider = this.getProvider();
    console.log(`[PaymentService] provider=${provider} method=${input.paymentMethod}`);

    switch (provider) {

      case "SHOPIFY":
        throw new Error("Shopify checkout provider not implemented yet");
      case "MOCK":
      default:
        return processMockCheckout(input);
    }
  }
}