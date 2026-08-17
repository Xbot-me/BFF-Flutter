// ============================================================
// lib/services/payment.service.ts  (updated to use MockCheckoutProvider)
// ============================================================
 
import { CheckoutRequest, CheckoutResponse } from "../validations/checkout.schema";
import { MockCheckoutProvider } from "../providers/mock/mock.checkout";
 

type P = "MOCK" | "SHOPIFY";
const getProvider = (): P => (process.env.NEXT_PUBLIC_API_SOURCE ?? "MOCK") as P;

export class PaymentService {
  static async processCheckout(input: CheckoutRequest): Promise<CheckoutResponse> {
    switch (getProvider()) {

      case "SHOPIFY": throw new Error("Shopify checkout not implemented yet");
      default: return MockCheckoutProvider.processCheckout(input);
    }
  }
}