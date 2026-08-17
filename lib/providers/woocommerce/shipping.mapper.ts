import { ShippingRate } from "../../models/shipping";

export function transformWooShippingRates(wooRates: any[]): ShippingRate[] {
  return wooRates.map(rate => {
    // WooCommerce USPS plugin usually returns rates in 'method_id:instance_id' format
    // We normalize this so Shopify migration won't break the UI
    return {
      id: rate.rate_id, // e.g. "usps:1"
      title: rate.name, // e.g. "Priority Mail"
      price: parseFloat(rate.price) / 100, // Woo Store API often sends in cents
      currency: rate.currency_code || "USD",
      estimatedDays: rate.meta_data?.estimated_delivery_date || "Standard Delivery",
      provider: "USPS"
    };
  });
}