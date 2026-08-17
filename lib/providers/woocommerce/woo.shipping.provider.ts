import { ShippingRate } from "../../models/shipping";
import { transformWooShippingRates } from "./shipping.mapper";

const WOO_STORE_BASE = `${process.env.WOOCOMMERCE_URL}/wp-json/wc/store/v1`;

// ---------------------------------------------------------------------------
// WooShippingProvider — same interface as MockShippingProvider
// ---------------------------------------------------------------------------

export class WooShippingProvider {

  /**
   * Fetches available shipping rates for the current cart.
   *
   * WooCommerce Store API calculates rates based on the cart's shipping address.
   * The address must be set on the cart before calling this — done via
   * /cart/update-customer with the destination address.
   *
   * addressId is accepted to match the MockShippingProvider signature but
   * the actual address lookup and cart update happens here internally.
   */
  static async getRates(
    addressId: string,
    cartToken: string,
  ): Promise<ShippingRate[]> {
    // 1. Fetch cart to get current shipping packages with available rates
    const res = await fetch(`${WOO_STORE_BASE}/cart`, {
      method:  "GET",
      headers: {
        "Content-Type": "application/json",
        "Cart-Token":   cartToken,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message ?? `Failed to fetch cart shipping rates (HTTP ${res.status})`);
    }

    const cart = await res.json();

    // 2. Extract all rates from all shipping packages
    // WooCommerce groups rates into packages (e.g. one per warehouse)
    // We flatten all packages into a single rate list for Flutter
    const allRates: any[] = [];
    for (const pkg of cart.shipping_rates ?? []) {
      for (const rate of pkg.shipping_rates ?? []) {
        allRates.push(rate);
      }
    }

    if (allRates.length === 0) {
      // No rates available — return empty array, Flutter handles this state
      return [];
    }

    return transformWooShippingRates(allRates);
  }

  /**
   * Selects a shipping rate on the WooCommerce cart.
   * Must be called before checkout so Woo calculates the correct total.
   */
  static async selectRate(
    rateId: string,
    cartToken: string,
  ): Promise<ShippingRate> {
    // 1. Get current cart to find which package this rate belongs to
    const cartRes = await fetch(`${WOO_STORE_BASE}/cart`, {
      headers: { "Cart-Token": cartToken },
    });
    if (!cartRes.ok) throw new Error("Failed to fetch cart");
    const cart = await cartRes.json();

    // 2. Find the package index that contains this rate
    const packages: any[] = cart.shipping_rates ?? [];
    let packageIdx = 0;
    for (let i = 0; i < packages.length; i++) {
      const found = packages[i].shipping_rates?.find((r: any) => r.rate_id === rateId);
      if (found) { packageIdx = i; break; }
    }

    // 3. Select the rate via Store API
    const selectRes = await fetch(`${WOO_STORE_BASE}/cart/select-shipping-rate`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "Cart-Token":   cartToken,
      },
      body: JSON.stringify({ package_id: packageIdx, rate_id: rateId }),
    });

    if (!selectRes.ok) {
      const err = await selectRes.json().catch(() => ({}));
      throw new Error(err?.message ?? `Failed to select shipping rate (HTTP ${selectRes.status})`);
    }

    // 4. Return the selected rate in our domain shape
    const allRates: any[] = packages.flatMap((pkg: any) => pkg.shipping_rates ?? []);
    const raw = allRates.find((r: any) => r.rate_id === rateId);
    if (!raw) throw new Error(`Shipping rate "${rateId}" not found`);

    return transformWooShippingRates([raw])[0];
  }
}