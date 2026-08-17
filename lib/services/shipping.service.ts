import { ShippingRate } from "../models/shipping";
import { MockShippingProvider } from "../providers/mock/mock.shipping.provider";

type Provider = "MOCK" | "WOO" | "SHOPIFY";

function getProvider(): Provider {
  return (process.env.NEXT_PUBLIC_API_SOURCE ?? "MOCK") as Provider;
}

export class ShippingService {

  static async getRates(addressId: string, cartToken: string): Promise<ShippingRate[]> {
    console.log(`[ShippingService] getRates via ${getProvider()}`);
    switch (getProvider()) {
      case "WOO": {
        const { WooShippingProvider } = await import("../providers/woocommerce/woo.shipping.provider");
        return WooShippingProvider.getRates(addressId, cartToken);
      }
      default:
        return MockShippingProvider.getRates(addressId, cartToken);
    }
  }

  static async selectRate(rateId: string, cartToken: string): Promise<ShippingRate> {
    switch (getProvider()) {
      case "WOO": {
        const { WooShippingProvider } = await import("../providers/woocommerce/woo.shipping.provider");
        return WooShippingProvider.selectRate(rateId, cartToken);
      }
      default:
        return MockShippingProvider.selectRate(rateId, cartToken);
    }
  }
}