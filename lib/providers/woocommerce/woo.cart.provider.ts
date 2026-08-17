import { AppCart } from "../../models/cart";
import { transformWooCart, buildVariationPayload } from "./cart.mapper";

const WOO_STORE_BASE = `${process.env.WOOCOMMERCE_URL}/wp-json/wc/store/v1`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildHeaders(nonce: string, cartToken?: string | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Nonce":        nonce,
  };
  if (cartToken) headers["Cart-Token"] = cartToken;
  return headers;
}

function extractToken(res: Response, fallback?: string | null): string {
  return res.headers.get("Cart-Token") ?? fallback ?? "";
}

async function safeJson(res: Response): Promise<any> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Woo Store API returned non-JSON (HTTP ${res.status}): ${text.slice(0, 200)}`
    );
  }
  return res.json();
}

async function handleResponse(
  res: Response,
  fallbackToken?: string | null,
): Promise<{ raw: any; token: string }> {
  const raw = await safeJson(res);
  if (!res.ok) throw new Error(raw?.message ?? `Store API error (HTTP ${res.status})`);
  return { raw, token: extractToken(res, fallbackToken) };
}

// ---------------------------------------------------------------------------
// WooCartProvider — mirrors MockCartProvider interface exactly
// ---------------------------------------------------------------------------

export class WooCartProvider {

  static async getCart(
    nonce: string,
    cartToken?: string | null,
  ): Promise<{ cart: AppCart; cartToken: string }> {
    const res = await fetch(`${WOO_STORE_BASE}/cart`, {
      method:  "GET",
      headers: buildHeaders(nonce, cartToken),
    });
    const { raw, token } = await handleResponse(res, cartToken);
    return { cart: transformWooCart(raw, token), cartToken: token };
  }

  /**
   * variantId — when provided, passed as `id` directly to Store API.
   *             This is the variation post ID (e.g. 1436738).
   *             WooCommerce resolves the parent + attributes automatically.
   *             Eliminates pa_ prefix issues entirely.
   *
   * selectedOptions — used as fallback when variantId is absent.
   *                   Converted to variation[] attribute array via buildVariationPayload.
   */
  static async addItem(
    productId: string,
    quantity: number,
    nonce: string,
    cartToken?: string | null,
    selectedOptions?: Record<string, string>,
    variantId?: string,
  ): Promise<{ cart: AppCart; cartToken: string }> {

    const payload: Record<string, any> = { quantity };

    if (variantId) {
      // Option B — use variation ID directly as the item ID
      // Store API accepts both parent and variation IDs in the `id` field
      payload.id = parseInt(variantId, 10);
    } else {
      // Fallback — use parent product ID + variation attributes array
      payload.id = parseInt(productId, 10);
      if (selectedOptions && Object.keys(selectedOptions).length > 0) {
        payload.variation = buildVariationPayload(selectedOptions);
      }
    }

    const res = await fetch(`${WOO_STORE_BASE}/cart/add-item`, {
      method:  "POST",
      headers: buildHeaders(nonce, cartToken),
      body:    JSON.stringify(payload),
    });
    const { raw, token } = await handleResponse(res, cartToken);
    return { cart: transformWooCart(raw, token), cartToken: token };
  }

  static async removeItem(
    cartItemKey: string,
    nonce: string,
    cartToken: string,
  ): Promise<{ cart: AppCart; cartToken: string }> {
    const res = await fetch(`${WOO_STORE_BASE}/cart/remove-item`, {
      method:  "POST",
      headers: buildHeaders(nonce, cartToken),
      body:    JSON.stringify({ key: cartItemKey }),
    });
    const { raw, token } = await handleResponse(res, cartToken);
    return { cart: transformWooCart(raw, token), cartToken: token };
  }

  static async updateItemQuantity(
    cartItemKey: string,
    quantity: number,
    nonce: string,
    cartToken: string,
  ): Promise<{ cart: AppCart; cartToken: string }> {
    const res = await fetch(`${WOO_STORE_BASE}/cart/update-item`, {
      method:  "POST",
      headers: buildHeaders(nonce, cartToken),
      body:    JSON.stringify({ key: cartItemKey, quantity }),
    });
    const { raw, token } = await handleResponse(res, cartToken);
    return { cart: transformWooCart(raw, token), cartToken: token };
  }

  static async applyCoupon(
    code: string,
    nonce: string,
    cartToken: string,
  ): Promise<{ cart: AppCart; cartToken: string }> {
    const res = await fetch(`${WOO_STORE_BASE}/cart/apply-coupon`, {
      method:  "POST",
      headers: buildHeaders(nonce, cartToken),
      body:    JSON.stringify({ code }),
    });
    const { raw, token } = await handleResponse(res, cartToken);
    return { cart: transformWooCart(raw, token), cartToken: token };
  }

  static async removeCoupon(
    code: string,
    nonce: string,
    cartToken: string,
  ): Promise<{ cart: AppCart; cartToken: string }> {
    const res = await fetch(`${WOO_STORE_BASE}/cart/remove-coupon`, {
      method:  "POST",
      headers: buildHeaders(nonce, cartToken),
      body:    JSON.stringify({ code }),
    });
    const { raw, token } = await handleResponse(res, cartToken);
    return { cart: transformWooCart(raw, token), cartToken: token };
  }


  // ============================================================
// providers/woocommerce/woo.cart.provider.ts  ← ADD mergeCarts method
// Add inside WooCartProvider class
// ============================================================
 
static async mergeCarts(
  guestCartToken: string,
  userCartToken:  string | null | undefined,
  nonce:          string,
): Promise<AppCart> {
  // WooCommerce Store API does not have a native merge endpoint.
  // Strategy: fetch the guest cart items, add each to the user cart.
  // If the user has no cart yet, just reassign the guest cart token.
 
  if (!userCartToken) {
    // No user cart — treat guest cart as the user cart
    const res = await fetch(`${WOO_STORE_BASE}/cart`, {
      headers: buildHeaders(nonce, guestCartToken),
    });
    const { raw, token } = await handleResponse(res, guestCartToken);
    return transformWooCart(raw, token);
  }
 
  // Fetch guest cart items
  const guestRes = await fetch(`${WOO_STORE_BASE}/cart`, {
    headers: buildHeaders(nonce, guestCartToken),
  });
  const { raw: guestRaw } = await handleResponse(guestRes, guestCartToken);
  const guestItems: any[] = guestRaw.items ?? [];
 
  // Add each guest item to the user cart
  for (const item of guestItems) {
    await fetch(`${WOO_STORE_BASE}/cart/add-item`, {
      method:  "POST",
      headers: buildHeaders(nonce, userCartToken),
      body:    JSON.stringify({ id: item.id, quantity: item.quantity }),
    });
  }
 
  // Return the merged user cart
  const mergedRes = await fetch(`${WOO_STORE_BASE}/cart`, {
    headers: buildHeaders(nonce, userCartToken),
  });
  const { raw: mergedRaw, token: mergedToken } = await handleResponse(mergedRes, userCartToken);
  return transformWooCart(mergedRaw, mergedToken);
}
}