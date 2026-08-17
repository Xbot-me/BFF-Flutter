import { AppCart, CartItem, CartTotals, CartCoupon } from "../../models/cart";

/**
 * Store API returns ALL prices as minor units (integers).
 * e.g. $65.00 => "6500", ₩1000 => "1000"
 * Always divide by 100 after parsing.
 */
const fromMinorUnits = (value: string | number | undefined): number =>
  parseFloat(String(value || "0")) / 100;

/**
 * WooCommerce prefixes global attributes with "pa_" (e.g. pa_size, pa_version).
 * Local (per-product) attributes have no prefix.
 * We strip pa_ and capitalise the first letter for clean Flutter display.
 */
const cleanAttributeName = (raw: string): string => {
  const stripped = raw.replace(/^pa_/, "");
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
};

/**
 * CART ADAPTER
 * Translates WooCommerce Store API cart response → AppCart domain model.
 * token must be passed in from the Cart-Token response header.
 */
export function transformWooCart(wooCart: any, token: string): AppCart {

  // 1. Items
  const items: CartItem[] = (wooCart.items || []).map((item: any): CartItem => ({
    key:       item.key,
    productId: item.id?.toString() ?? "",
    variantId: item.variation_id ? item.variation_id.toString() : undefined,
    name:      item.name ?? "",
    quantity:  item.quantity ?? 1,
    price:     fromMinorUnits(item.prices?.price),       // FIX: divide by 100
    lineTotal: fromMinorUnits(item.totals?.line_total),  // FIX: divide by 100
    image:     item.images?.[0]?.src ?? "https://placehold.co/150x150?text=No+Image",
    options:   (item.variation || []).map((v: any) => ({
      name:  cleanAttributeName(v.attribute ?? "Option"),
      value: v.value ?? "",
    })),
  }));

  // 2. Totals — every field is minor units
  const totals: CartTotals = {
    subtotal:      fromMinorUnits(wooCart.totals?.total_items),    // FIX: divide by 100
    taxTotal:      fromMinorUnits(wooCart.totals?.total_tax),      // FIX: divide by 100
    shippingTotal: fromMinorUnits(wooCart.totals?.total_shipping), // FIX: divide by 100
    discountTotal: fromMinorUnits(wooCart.totals?.total_discount), // FIX: divide by 100
    total:         fromMinorUnits(wooCart.totals?.total_price),    // FIX: divide by 100
    currencyCode:  wooCart.totals?.currency_code   ?? "USD",
    currencySymbol: wooCart.totals?.currency_symbol ?? "$",
  };

  // 3. Coupons
  const coupons: CartCoupon[] = (wooCart.coupons || []).map((c: any): CartCoupon => ({
    code:         c.code ?? "",
    discountType: c.discount_type ?? "fixed_cart",
    discount:     fromMinorUnits(c.totals?.total_discount),
  }));

  // 4. Assemble
  return {
    cartToken:    token,
    items,
    itemsCount:   items.reduce((acc, item) => acc + item.quantity, 0),
    totals,
    coupons,
    needsShipping: wooCart.needs_shipping ?? false,
    needsPayment:  wooCart.needs_payment  ?? true,
    isEmpty:       items.length === 0,
  };
}

/**
 * VARIATION PAYLOAD BUILDER
 * Converts ProductVariant.selectedOptions → Store API variation array.
 *
 * Store API expects:
 *   variation: [{ attribute: "pa_size", value: "M" }, ...]
 *
 * Our selectedOptions are already lowercased (e.g. { size: "M" }).
 * We re-apply the pa_ prefix for global attributes.
 * If you use local (per-product) attributes, they have no pa_ prefix — pass them as-is.
 */
export function buildVariationPayload(
  selectedOptions: Record<string, string>
): Array<{ attribute: string; value: string }> {
  return Object.entries(selectedOptions).map(([key, value]) => ({
    attribute: `pa_${key}`,  // global attribute format — adjust if using local attributes
    value,
  }));
}

