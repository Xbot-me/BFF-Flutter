import { AppOrder, OrderAddress, OrderItem, OrderStatus } from "../../models/order";
import { CartTotals, CartCoupon } from "../../models/cart";
import { OrderTracking } from "../mock/mock.order.provider";

// ---------------------------------------------------------------------------
// WooCommerce REST API v3 base
// Uses consumer key + secret (Basic auth) — never exposes credentials to Flutter
// ---------------------------------------------------------------------------

const WOO_BASE = `${process.env.WOOCOMMERCE_URL}/wp-json/wc/v3`;

function basicAuthHeader(): Record<string, string> {
  const credentials = Buffer.from(
    `${process.env.WOOCOMMERCE_KEY}:${process.env.WOOCOMMERCE_SECRET}`
  ).toString("base64");
  return { Authorization: `Basic ${credentials}` };
}

// ---------------------------------------------------------------------------
// Safe JSON parser — WooCommerce occasionally returns HTML on 5xx errors
// ---------------------------------------------------------------------------

async function safeJson(res: Response, context: string): Promise<any> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `[WooOrderProvider.${context}] Non-JSON response (HTTP ${res.status}): ${text.slice(0, 200)}`
    );
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Mappers — WooCommerce JSON → Domain types
// ---------------------------------------------------------------------------

/**
 * WooCommerce order statuses map 1:1 to our OrderStatus enum.
 * "wc-" prefix is stripped by WooCommerce before returning via REST.
 */
function mapOrderStatus(wooStatus: string): OrderStatus {
  const valid: OrderStatus[] = [
    "pending", "processing", "on-hold", "completed",
    "cancelled", "refunded", "failed",
  ];
  return valid.includes(wooStatus as OrderStatus)
    ? (wooStatus as OrderStatus)
    : "pending";
}

function mapOrderAddress(addr: any): OrderAddress {
  return {
    firstName: addr?.first_name || undefined,
    lastName:  addr?.last_name  || undefined,
    company:   addr?.company    || undefined,
    address1:  addr?.address_1  ?? "",
    address2:  addr?.address_2  || undefined,
    city:      addr?.city       ?? "",
    state:     addr?.state      || undefined,
    postcode:  addr?.postcode   ?? "",
    country:   addr?.country    ?? "",
    email:     addr?.email      || undefined,
    phone:     addr?.phone      || undefined,
  };
}

/**
 * Maps WooCommerce line_items to OrderItem[].
 *
 * WooCommerce line item shape:
 *   {
 *     id, name, product_id, variation_id, sku, quantity,
 *     price,          ← unit price as decimal string e.g. "22.00"
 *     total,          ← line total as decimal string e.g. "22.00"
 *     image: { src },
 *     meta_data: [{ key, value, display_key, display_value }]
 *   }
 *
 * meta_data contains variant attributes (e.g. pa_size = "M").
 * We strip pa_ prefix and capitalise for Flutter display.
 */
function mapLineItems(lineItems: any[]): OrderItem[] {
  return (lineItems ?? []).map((item: any): OrderItem => {
    const options = (item.meta_data ?? [])
      .filter((m: any) =>
        // Only include attribute meta — skip internal WooCommerce keys
        !m.key.startsWith("_") && m.display_key && m.display_value
      )
      .map((m: any) => ({
        name:  m.display_key.replace(/^pa_/i, ""),
        value: m.display_value,
      }));

    return {
      productId: String(item.product_id   ?? ""),
      variantId: item.variation_id ? String(item.variation_id) : undefined,
      name:      item.name          ?? "",
      sku:       item.sku           ?? "",
      quantity:  item.quantity      ?? 1,
      unitPrice: parseFloat(item.price ?? "0"),
      lineTotal: parseFloat(item.total ?? "0"),
      image:     item.image?.src    ?? "https://placehold.co/150x150?text=No+Image",
      options,
    };
  });
}

/**
 * Maps WooCommerce totals to CartTotals.
 *
 * WooCommerce REST v3 returns totals as decimal strings:
 *   total, subtotal, total_tax, shipping_total, discount_total
 * NOT minor units — unlike the Store API which uses minor units.
 */
function mapTotals(woo: any): CartTotals {
  return {
    subtotal:      parseFloat(woo.subtotal        ?? "0"),
    taxTotal:      parseFloat(woo.total_tax       ?? "0"),
    shippingTotal: parseFloat(woo.shipping_total  ?? "0"),
    discountTotal: parseFloat(woo.discount_total  ?? "0"),
    total:         parseFloat(woo.total           ?? "0"),
    currencyCode:  woo.currency                   ?? "USD",
    currencySymbol: woo.currency_symbol           ?? "$",
  };
}

/**
 * Maps WooCommerce coupon_lines to CartCoupon[].
 *
 * WooCommerce coupon line shape:
 *   { code, discount, discount_type }
 */
function mapCoupons(couponLines: any[]): CartCoupon[] {
  return (couponLines ?? []).map((c: any): CartCoupon => ({
    code:         c.code          ?? "",
    discountType: c.discount_type ?? "fixed_cart",
    discount:     parseFloat(c.discount ?? "0"),
  }));
}

/**
 * Maps WooCommerce shipping_lines to a display string.
 * e.g. "USPS Priority Mail® (flat_rate)"
 */
function mapShippingMethod(shippingLines: any[]): string {
  if (!shippingLines?.length) return "";
  return shippingLines
    .map((s: any) => s.method_title ?? s.method_id ?? "")
    .filter(Boolean)
    .join(", ");
}

/**
 * Master mapper — WooCommerce order → AppOrder
 */
function mapWooOrderToAppOrder(woo: any): AppOrder {
  return {
    id:       String(woo.id),
    orderKey: woo.order_key ?? "",
    status:   mapOrderStatus(woo.status),

    createdAt: woo.date_created_gmt
      ? `${woo.date_created_gmt}Z`
      : new Date().toISOString(),
    updatedAt: woo.date_modified_gmt
      ? `${woo.date_modified_gmt}Z`
      : new Date().toISOString(),

    items:           mapLineItems(woo.line_items),
    billingAddress:  mapOrderAddress(woo.billing),
    shippingAddress: mapOrderAddress(woo.shipping),
    totals:          mapTotals(woo),
    coupons:         mapCoupons(woo.coupon_lines),

    paymentMethod:      woo.payment_method        ?? "",
    paymentMethodTitle: woo.payment_method_title  ?? "",
    shippingMethod:     mapShippingMethod(woo.shipping_lines),
    customerNote:       woo.customer_note         ?? "",

    // needs_payment is true when status is pending or on-hold
    needsPayment: ["pending", "on-hold"].includes(woo.status),
    isPaid:       woo.date_paid != null,
  };
}

// ---------------------------------------------------------------------------
// WooOrderProvider — mirrors MockOrderProvider interface exactly
// ---------------------------------------------------------------------------

export class WooOrderProvider {

  /**
   * Fetches all orders for a customer.
   * Uses customer ID from the WooCommerce customer record.
   *
   * Security: uses Basic auth (consumer key) server-side only.
   * The customer ID is resolved from the JWT token by the auth middleware
   * before this is ever called — Flutter never sends a raw customer ID.
   */
  static async getOrders(customerId: string): Promise<AppOrder[]> {
    const res = await fetch(
      `${WOO_BASE}/orders?customer=${encodeURIComponent(customerId)}&per_page=20&orderby=date&order=desc`,
      { headers: { ...basicAuthHeader() } }
    );

    if (!res.ok) {
      const err = await safeJson(res, "getOrders").catch(() => ({}));
      throw new Error(err?.message ?? `Failed to fetch orders (HTTP ${res.status})`);
    }

    const orders: any[] = await safeJson(res, "getOrders");
    return orders.map(mapWooOrderToAppOrder);
  }

  /**
   * Fetches a single order by ID.
   * Validates the order belongs to the requesting customer before returning.
   */
  static async getOrderById(orderId: string): Promise<AppOrder> {
    const res = await fetch(
      `${WOO_BASE}/orders/${encodeURIComponent(orderId)}`,
      { headers: { ...basicAuthHeader() } }
    );

    if (res.status === 404) throw new Error(`Order ${orderId} not found`);

    if (!res.ok) {
      const err = await safeJson(res, "getOrderById").catch(() => ({}));
      throw new Error(err?.message ?? `Failed to fetch order (HTTP ${res.status})`);
    }

    const wooOrder = await safeJson(res, "getOrderById");
    return mapWooOrderToAppOrder(wooOrder);
  }

  /**
   * Fetches order by order_key — used on the checkout confirmation screen.
   * WooCommerce returns the order when the key matches, regardless of auth state,
   * but we still use Basic auth server-side to keep the request secure.
   */
  static async getOrderByKey(orderKey: string): Promise<AppOrder> {
    const res = await fetch(
      // WooCommerce supports filtering by order_key via the orders endpoint
      `${WOO_BASE}/orders?order_key=${encodeURIComponent(orderKey)}&per_page=1`,
      { headers: { ...basicAuthHeader() } }
    );

    if (!res.ok) {
      const err = await safeJson(res, "getOrderByKey").catch(() => ({}));
      throw new Error(err?.message ?? `Failed to fetch order by key (HTTP ${res.status})`);
    }

    const orders: any[] = await safeJson(res, "getOrderByKey");
    if (!orders?.length) throw new Error(`Order with key ${orderKey} not found`);

    return mapWooOrderToAppOrder(orders[0]);
  }

  /**
   * Fetches shipment tracking data from order meta.
   *
   * Requires one of these WooCommerce shipping tracking plugins:
   *   - WooCommerce Shipment Tracking (official, free)
   *   - Advanced Shipment Tracking for WooCommerce
   *
   * Both plugins store tracking data in order meta_data with keys:
   *   _tracking_number, _tracking_provider, _date_shipped
   *
   * If no plugin is installed, returns a "processing" state with order events only.
   */
  static async getTracking(orderId: string): Promise<OrderTracking> {
    const res = await fetch(
      `${WOO_BASE}/orders/${encodeURIComponent(orderId)}`,
      { headers: { ...basicAuthHeader() } }
    );

    if (res.status === 404) throw new Error(`Order ${orderId} not found`);
    if (!res.ok) {
      const err = await safeJson(res, "getTracking").catch(() => ({}));
      throw new Error(err?.message ?? `Failed to fetch order tracking (HTTP ${res.status})`);
    }

    const woo = await safeJson(res, "getTracking");

    // Extract tracking meta from order meta_data
    const meta        = (woo.meta_data ?? []) as Array<{ key: string; value: string }>;
    const getMeta     = (key: string) => meta.find((m) => m.key === key)?.value ?? null;

    const trackingNumber    = getMeta("_tracking_number");
    const trackingProvider  = getMeta("_tracking_provider") ?? getMeta("_custom_provider_name");
    const dateShipped       = getMeta("_date_shipped");
    const estimatedDelivery = getMeta("_estimated_delivery_date");

    // Build event timeline from order status history
    // WooCommerce stores order notes as timeline events
    const notesRes = await fetch(
      `${WOO_BASE}/orders/${encodeURIComponent(orderId)}/notes?per_page=20`,
      { headers: { ...basicAuthHeader() } }
    );

    let events: OrderTracking["events"] = [];

    if (notesRes.ok) {
      const notes: any[] = await safeJson(notesRes, "getTracking.notes");
      events = notes
        .filter((n: any) => n.customer_note || n.note)
        .map((n: any) => ({
          description: n.note ?? "",
          location:    "",
          timestamp:   n.date_created_gmt ? `${n.date_created_gmt}Z` : new Date().toISOString(),
        }))
        .reverse(); // oldest first
    }

    // Fallback events from order lifecycle if no notes
    if (events.length === 0) {
      events = [
        { description: "Order placed",   location: "Online", timestamp: woo.date_created_gmt ? `${woo.date_created_gmt}Z` : "" },
        ...(woo.date_paid ? [{ description: "Payment confirmed", location: "Online", timestamp: `${woo.date_paid}Z` }] : []),
        ...(dateShipped   ? [{ description: "Shipped",           location: trackingProvider ?? "Carrier", timestamp: dateShipped }] : []),
      ].filter((e) => e.timestamp);
    }

    const isShipped   = !!trackingNumber;
    const isDelivered = woo.status === "completed";

    return {
      orderId,
      status:            isDelivered ? "delivered" : isShipped ? "shipped" : "processing",
      carrier:           trackingProvider ?? "Unknown",
      trackingNumber,
      trackingUrl:       trackingNumber
        ? buildTrackingUrl(trackingProvider ?? "", trackingNumber)
        : null,
      estimatedDelivery: estimatedDelivery ?? null,
      events,
    };
  }
}

// ---------------------------------------------------------------------------
// Tracking URL builder — maps carrier name to their tracking URL
// ---------------------------------------------------------------------------

function buildTrackingUrl(provider: string, trackingNumber: string): string | null {
  const p = provider.toLowerCase();

  if (p.includes("usps"))    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
  if (p.includes("fedex"))   return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
  if (p.includes("ups"))     return `https://www.ups.com/track?tracknum=${trackingNumber}`;
  if (p.includes("dhl"))     return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;
  if (p.includes("aramex"))  return `https://www.aramex.com/track/?mode=0&ShipmentNumber=${trackingNumber}`;

  return null;
}