import type { CheckoutRequest, CheckoutResponse, WooError } from "../validations/checkout.schema";

// ---------------------------------------------------------------------------
// Internal types — WooCommerce Store API shapes
// ---------------------------------------------------------------------------

interface WooCheckoutPayload {
  billing_address:  Record<string, string>;
  shipping_address: Record<string, string>;
  payment_method:   string;
  payment_data:     Array<{ key: string; value: string }>;
  shipping_lines?:  Array<{ method_id: string }>;
  customer_note?:   string;
}

interface WooCheckoutSuccess {
  order_id:       number;
  order_key:      string;
  payment_result: {
    payment_status:  string;
    payment_details: Array<{ key: string; value: string }>;
    redirect_url:    string;
  };
}

interface WooApiError {
  code:     string;
  message:  string;
  data?:    { status?: number; params?: Record<string, string> };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildWooHeaders(cartToken: string, nonce: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "Cart-Token":   cartToken,
    "Nonce":        nonce,
  };
}

function mapAddressToWoo(
  address: Record<string, string | undefined>
): Record<string, string> {
  return {
    first_name: address.first_name ?? "",
    last_name:  address.last_name  ?? "",
    address_1:  address.address_1  ?? "",
    address_2:  address.address_2  ?? "",
    city:       address.city       ?? "",
    state:      address.state      ?? "",
    postcode:   address.postcode   ?? "",
    country:    address.country    ?? "",
    email:      address.email      ?? "",   // only present on billing — Woo ignores it if empty on shipping
    phone:      address.phone      ?? "",
  };
}

/**
 * WooCommerce occasionally returns an HTML page instead of JSON:
 *  - PHP fatal errors
 *  - Cloudflare 5xx interception
 *  - Maintenance mode
 * This guard converts those cases to a typed error instead of a cryptic parse failure.
 */
async function safeParseWooResponse(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `WooCommerce returned non-JSON (HTTP ${res.status}). ` +
      `Content-Type: ${contentType}. Body preview: ${text.slice(0, 300)}`
    );
  }

  try {
    return await res.json();
  } catch {
    throw new Error(`Failed to parse WooCommerce JSON response (HTTP ${res.status})`);
  }
}

// ---------------------------------------------------------------------------
// WooCommerce provider
// ---------------------------------------------------------------------------

async function processWooCheckout(input: CheckoutRequest): Promise<CheckoutResponse> {
  const baseUrl = process.env.WOOCOMMERCE_URL;
  if (!baseUrl) throw new Error("WOOCOMMERCE_URL environment variable is not set");

  const payload: WooCheckoutPayload = {
    billing_address:  mapAddressToWoo({ ...input.billingAddress }),
    shipping_address: mapAddressToWoo({ ...input.shippingAddress }),
    payment_method:   input.paymentMethod,
    payment_data:     input.paymentData,
    customer_note:    input.customerNote,
  };

  // Include shipping method if Flutter provided it
  if (input.shippingMethod && input.shippingMethod.length > 0) {
    payload.shipping_lines = input.shippingMethod.map((methodId) => ({
      method_id: methodId,
    }));
  }

  let res: Response;

  try {
    res = await fetch(`${baseUrl}/wp-json/wc/store/v1/checkout`, {
      method:  "POST",
      headers: buildWooHeaders(input.cartToken, input.nonce),
      body:    JSON.stringify(payload),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    return {
      success: false,
      type:    "network_error",
      message: `Could not reach WooCommerce: ${message}`,
      error:   { code: "network_error", message },
    };
  }

  const json = await safeParseWooResponse(res);

  if (!res.ok) {
    const err = json as WooApiError;
    const wooError: WooError = {
      code:    err?.code,
      message: err?.message,
      data:    err?.data,
    };

    // Distinguish payment failure (402) from other errors
    const type = res.status === 402 ? "payment_error" : "server_error";

    return {
      success: false,
      type,
      message: err?.message ?? "Checkout failed",
      error:   wooError,
      details: { status: res.status, params: err?.data?.params ?? {} },
    };
  }

  const data = json as WooCheckoutSuccess;

  return {
    success:  true,
    type:     "success",
    orderId:  String(data.order_id),
    orderKey: data.order_key,
    message:  "Order placed successfully",
    details: {
      paymentStatus: data.payment_result?.payment_status,
      redirectUrl:   data.payment_result?.redirect_url,
    },
  };
}

// ---------------------------------------------------------------------------
// Mock provider — simulates real-world failure scenarios for Flutter UI dev
// ---------------------------------------------------------------------------

const MOCK_FAILURE_RATE = 0.15;

const MOCK_FAILURE_SCENARIOS: CheckoutResponse[] = [
  {
    success: false,
    type:    "payment_error",
    message: "Payment declined by issuing bank",
    error:   { code: "payment_declined", message: "Your card was declined. Please try a different card." },
  },
  {
    success: false,
    type:    "payment_error",
    message: "Insufficient funds",
    error:   { code: "insufficient_funds", message: "This card has insufficient funds to complete the purchase." },
  },
  {
    success: false,
    type:    "server_error",
    message: "Payment gateway timeout",
    error:   { code: "gateway_timeout", message: "The payment gateway did not respond in time. Please try again." },
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

type ProviderType = "MOCK" | "WOO" | "SHOPIFY";

export class PaymentService {
  private static getProvider(): ProviderType {
    return (process.env.NEXT_PUBLIC_API_SOURCE ?? "MOCK") as ProviderType;
  }

  static async processCheckout(input: CheckoutRequest): Promise<CheckoutResponse> {
    const provider = this.getProvider();
    console.log(`[PaymentService] provider=${provider} method=${input.paymentMethod}`);

    switch (provider) {
      case "WOO":
        return processWooCheckout(input);
      case "SHOPIFY":
        throw new Error("Shopify checkout provider not implemented yet");
      case "MOCK":
      default:
        return processMockCheckout(input);
    }
  }
}