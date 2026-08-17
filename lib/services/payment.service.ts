// ============================================================
// lib/services/payment.service.ts  (updated to use MockCheckoutProvider)
// ============================================================
 
import { CheckoutRequest, CheckoutResponse } from "../validations/checkout.schema";
import { MockCheckoutProvider } from "../providers/mock/mock.checkout";
 

type P = "MOCK" | "WOO" | "SHOPIFY";
const getProvider = (): P => (process.env.NEXT_PUBLIC_API_SOURCE ?? "MOCK") as P;

export class PaymentService {
  static async processCheckout(input: CheckoutRequest): Promise<CheckoutResponse> {
    switch (getProvider()) {
      case "WOO": return processWooCheckout(input);
      case "SHOPIFY": throw new Error("Shopify checkout not implemented yet");
      default: return MockCheckoutProvider.processCheckout(input);
    }
  }
}
 
async function processWooCheckout(input: CheckoutRequest): Promise<CheckoutResponse> {
  const baseUrl = process.env.WOOCOMMERCE_URL;
  if (!baseUrl) throw new Error("WOOCOMMERCE_URL not set");
 
  const payload = {
    billing_address:  { ...input.billingAddress },
    shipping_address: { ...input.shippingAddress },
    payment_method:   input.paymentMethod,
    payment_data:     input.paymentData,
    customer_note:    input.customerNote,
    ...(input.shippingMethod?.length
      ? { shipping_lines: input.shippingMethod.map((id) => ({ method_id: id })) }
      : {}),
  };
 
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/wp-json/wc/store/v1/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cart-Token": input.cartToken, "Nonce": input.nonce },
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    return { success: false, type: "network_error", message: `Network failure: ${err.message}`, error: { code: "network_error", message: err.message } };
  }
 
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(`WooCommerce returned non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }
 
  const json: any = await res.json();
  if (!res.ok) {
    return {
      success: false,
      type: res.status === 402 ? "payment_error" : "server_error",
      message: json?.message ?? "Checkout failed",
      error: { code: json?.code, message: json?.message, data: json?.data },
      details: { status: res.status, params: json?.data?.params ?? {} },
    };
  }
 
  return {
    success: true, type: "success",
    orderId: String(json.order_id), orderKey: json.order_key,
    message: "Order placed successfully",
    details: { paymentStatus: json.payment_result?.payment_status, redirectUrl: json.payment_result?.redirect_url },
  };
}