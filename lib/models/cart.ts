export interface CartItemOption {
  name: string;   // e.g. "Size", "Version"
  value: string;  // e.g. "M", "Dawn"
}

export interface CartItem {
  key: string;               // Shopify lineId — required for update/remove calls
  productId: string;
  variantId?: string;
  name: string;
  quantity: number;
  price: number;             // Unit price (already divided from minor units)
  lineTotal: number;         // price × quantity
  image: string;
  options: CartItemOption[];
}

export interface CartTotals {
  subtotal: number;
  taxTotal: number;
  shippingTotal: number;
  discountTotal: number;     // Added: coupon discounts affect this
  total: number;
  currencyCode: string;
  currencySymbol: string;    // Added: Flutter needs this for display
}

export interface CartCoupon {
  code: string;
  discountType: string;      // e.g. "percent", "fixed_cart"
  discount: number;
}

export interface AppCart {
  cartToken: string;
  items: CartItem[];
  itemsCount: number;
  totals: CartTotals;
  coupons: CartCoupon[];     // Added: K-pop drops commonly use discount codes
  needsShipping: boolean;    // Added: drives Flutter's shipping screen visibility
  needsPayment: boolean;     // Added: drives Flutter's payment screen visibility
  isEmpty: boolean;
}