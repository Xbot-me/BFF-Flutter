import { ShippingRate } from "../../models/shipping";
import { MOCK_USPS_RATES } from "./mock.shipping";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export class MockShippingProvider {

  static async getRates(_addressId: string, _cartToken: string): Promise<ShippingRate[]> {
    await delay(700);
    // No country restriction in mock mode — that belongs in the Woo/Shopify adapter
    return MOCK_USPS_RATES;
  }

  static async selectRate(rateId: string, _cartToken: string): Promise<ShippingRate> {
    await delay(300);
    const rate = MOCK_USPS_RATES.find((r) => r.id === rateId);
    if (!rate) throw new Error(`Shipping rate "${rateId}" not found`);
    return rate;
  }
}