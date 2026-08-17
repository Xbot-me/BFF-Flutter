import { ShippingRate } from "../models/shipping";
import { MockShippingProvider } from "../providers/mock/mock.shipping.provider";

type Provider = "MOCK" | "SHOPIFY";

function getProvider(): Provider {
  return (process.env.NEXT_PUBLIC_API_SOURCE ?? "MOCK") as Provider;
}

export class ShippingService {

  static async getRates(addressId: string, cartToken: string): Promise<ShippingRate[]> {
    console.log(`[ShippingService] getRates via ${getProvider()}`);
    switch (getProvider()) {
      default:
        return MockShippingProvider.getRates(addressId, cartToken);
    }
  }

  static async selectRate(rateId: string, cartToken: string): Promise<ShippingRate> {
    switch (getProvider()) {
      default:
        return MockShippingProvider.selectRate(rateId, cartToken);
    }
  }
}