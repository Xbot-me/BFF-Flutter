/**
 * INDUSTRY STANDARD: Shipping Rate Contract
 * This keeps the Flutter app agnostic of the provider (USPS vs Shopify Shipping).
 */

export interface ShippingRate {
  id: string;               // Unique ID from the backend (e.g., "usps:priority_mail")
  title: string;            // Display name for the user (e.g., "Priority Mail®")
  price: number;            // Fixed decimal (e.g., 10.40)
  currency: string;         // Default to "USD"
  estimatedDays?: string;   // Optional display text (e.g., "1-3 business days")
  provider: string;         // Internal tag for tracking (e.g., "USPS")
  metadata?: Record<string, any>; // For extra data like 'is_po_box_eligible'
}

export interface ShippingRatesResponse {
  rates: ShippingRate[];
  selectedRateId?: string;
  destinationSummary: string; // e.g., "Shipping to New York, 10001"
}