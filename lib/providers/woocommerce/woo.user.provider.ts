import { AppUser, Address } from "../../models/user";
import { RewardEvent } from "../mock/mock.user.provider";

// ---------------------------------------------------------------------------
// WooCommerce REST API v3
// All calls use Basic auth (consumer key + secret) — server-side only.
// JWT token is validated separately by WooAuthProvider before these run.
// ---------------------------------------------------------------------------

const WOO_BASE = `${process.env.WOOCOMMERCE_URL}/wp-json/wc/v3`;
const WP_BASE  = `${process.env.WOOCOMMERCE_URL}/wp-json`;

function basicAuthHeader(): Record<string, string> {
  const credentials = Buffer.from(
    `${process.env.WOOCOMMERCE_KEY}:${process.env.WOOCOMMERCE_SECRET}`
  ).toString("base64");
  return { Authorization: `Basic ${credentials}` };
}

function jsonHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", ...basicAuthHeader() };
}

// ---------------------------------------------------------------------------
// Safe JSON parser
// ---------------------------------------------------------------------------

async function safeJson(res: Response, context: string): Promise<any> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `[WooUserProvider.${context}] Non-JSON response (HTTP ${res.status}): ${text.slice(0, 200)}`
    );
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

/**
 * WooCommerce customer → AppUser
 *
 * WooCommerce customer shape (relevant fields):
 *   id, email, first_name, last_name, username,
 *   billing: { first_name, last_name, address_1, address_2, city, state,
 *              postcode, country, email, phone },
 *   shipping: { first_name, last_name, address_1, address_2, city, state,
 *               postcode, country },
 *   date_created_gmt, date_modified_gmt
 */
function mapWooCustomerToAppUser(woo: any): AppUser {
  const addresses: Address[] = [];

  if (woo.billing?.address_1) {
    addresses.push({
      id:                `billing_${woo.id}`,
      firstName:         woo.billing.first_name || undefined,
      lastName:          woo.billing.last_name  || undefined,
      address1:          woo.billing.address_1,
      address2:          woo.billing.address_2  || undefined,
      city:              woo.billing.city,
      state:             woo.billing.state       || undefined,
      postcode:          woo.billing.postcode,
      country:           woo.billing.country,
      phone:             woo.billing.phone       || undefined,
      isDefaultBilling:  true,
      isDefaultShipping: false,
    });
  }

  if (woo.shipping?.address_1) {
    addresses.push({
      id:                `shipping_${woo.id}`,
      firstName:         woo.shipping.first_name || undefined,
      lastName:          woo.shipping.last_name  || undefined,
      address1:          woo.shipping.address_1,
      address2:          woo.shipping.address_2  || undefined,
      city:              woo.shipping.city,
      state:             woo.shipping.state       || undefined,
      postcode:          woo.shipping.postcode,
      country:           woo.shipping.country,
      // Shipping has no phone in WooCommerce — use billing phone
      phone:             woo.billing?.phone       || undefined,
      isDefaultBilling:  false,
      isDefaultShipping: true,
    });
  }

  return {
    id:           String(woo.id),
    email:        woo.email        ?? "",
    firstName:    woo.first_name   || undefined,
    lastName:     woo.last_name    || undefined,
    displayName:  woo.username     || undefined,
    phone:        woo.billing?.phone || undefined,
    rewardPoints: 0,  // populated from loyalty plugin if available
    addresses,
    defaultBillingAddressId:  addresses.find((a) => a.isDefaultBilling)?.id,
    defaultShippingAddressId: addresses.find((a) => a.isDefaultShipping)?.id,
    isGuest:    false,
    isVerified: true,
    createdAt:  woo.date_created_gmt  ? `${woo.date_created_gmt}Z`  : undefined,
    updatedAt:  woo.date_modified_gmt ? `${woo.date_modified_gmt}Z` : undefined,
  };
}

/**
 * Builds the WooCommerce billing/shipping payload from an Address.
 * Used by updateAddress and updateProfile.
 */
function mapAddressToWooBilling(address: Address, email?: string) {
  return {
    first_name: address.firstName ?? "",
    last_name:  address.lastName  ?? "",
    address_1:  address.address1,
    address_2:  address.address2  ?? "",
    city:       address.city,
    state:      address.state     ?? "",
    postcode:   address.postcode,
    country:    address.country,
    phone:      address.phone     ?? "",
    ...(email ? { email } : {}),
  };
}

function mapAddressToWooShipping(address: Address) {
  return {
    first_name: address.firstName ?? "",
    last_name:  address.lastName  ?? "",
    address_1:  address.address1,
    address_2:  address.address2  ?? "",
    city:       address.city,
    state:      address.state     ?? "",
    postcode:   address.postcode,
    country:    address.country,
  };
}

// ---------------------------------------------------------------------------
// WooUserProvider — mirrors MockUserProvider interface exactly
// ---------------------------------------------------------------------------

export class WooUserProvider {

  /**
   * Fetches a WooCommerce customer by their WP user ID.
   * Called by UserService and WooAuthProvider.getUser().
   */
  static async getUserById(userId: string): Promise<AppUser> {
    const res = await fetch(
      `${WOO_BASE}/customers/${encodeURIComponent(userId)}`,
      { headers: { ...basicAuthHeader() } }
    );

    if (res.status === 404) throw new Error(`Customer ${userId} not found`);
    if (!res.ok) {
      const err = await safeJson(res, "getUserById").catch(() => ({}));
      throw new Error(err?.message ?? `Failed to fetch customer (HTTP ${res.status})`);
    }

    return mapWooCustomerToAppUser(await safeJson(res, "getUserById"));
  }

  /**
   * Updates customer profile fields.
   *
   * WooCommerce accepts PATCH on /wc/v3/customers/:id.
   * Only the fields we send are updated — others are untouched.
   *
   * Security: userId is derived from the validated JWT, never from Flutter directly.
   */
  static async updateProfile(
    userId: string,
    updates: {
      firstName?:   string;
      lastName?:    string;
      phone?:       string;
      displayName?: string;
    },
    _token: string,   // kept for interface parity — auth handled via Basic auth here
  ): Promise<AppUser> {

    const payload: Record<string, any> = {};

    if (updates.firstName !== undefined) payload.first_name = updates.firstName;
    if (updates.lastName  !== undefined) payload.last_name  = updates.lastName;
    if (updates.phone     !== undefined) {
      // Phone lives on billing in WooCommerce, not on the customer root object
      payload.billing = { phone: updates.phone };
    }
    // WooCommerce has no displayName field — skip silently if provided

    const res = await fetch(`${WOO_BASE}/customers/${encodeURIComponent(userId)}`, {
      method:  "PUT",
      headers: jsonHeaders(),
      body:    JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await safeJson(res, "updateProfile").catch(() => ({}));
      throw new Error(err?.message ?? `Failed to update profile (HTTP ${res.status})`);
    }

    return mapWooCustomerToAppUser(await safeJson(res, "updateProfile"));
  }

  /**
   * Adds a new address to the customer.
   *
   * WooCommerce supports exactly two addresses per customer: billing and shipping.
   * There is no address book — we map to billing or shipping based on the
   * isDefaultBilling / isDefaultShipping flags.
   *
   * If neither flag is set, we default to shipping.
   */
  static async addAddress(userId: string, address: Omit<Address, "id">): Promise<Address> {
    const isBilling  = address.isDefaultBilling  ?? false;
    const isShipping = address.isDefaultShipping ?? !isBilling;

    const payload: Record<string, any> = {};

    if (isBilling)  payload.billing  = mapAddressToWooBilling(address as Address);
    if (isShipping) payload.shipping = mapAddressToWooShipping(address as Address);

    const res = await fetch(`${WOO_BASE}/customers/${encodeURIComponent(userId)}`, {
      method:  "PUT",
      headers: jsonHeaders(),
      body:    JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await safeJson(res, "addAddress").catch(() => ({}));
      throw new Error(err?.message ?? `Failed to add address (HTTP ${res.status})`);
    }

    const woo      = await safeJson(res, "addAddress");
    const updated  = mapWooCustomerToAppUser(woo);
    const newAddr  = updated.addresses?.find((a) =>
      isBilling ? a.isDefaultBilling : a.isDefaultShipping
    );

    if (!newAddr) throw new Error("Address was saved but could not be retrieved");
    return newAddr;
  }

  /**
   * Updates an existing address.
   *
   * WooCommerce addresses are identified by "billing_<id>" or "shipping_<id>"
   * format (set in mapWooCustomerToAppUser above).
   */
  static async updateAddress(
    userId:    string,
    addressId: string,
    updates:   Partial<Address>,
  ): Promise<Address> {

    // Determine which address slot this is
    const isBilling  = addressId.startsWith("billing_");
    const isShipping = addressId.startsWith("shipping_");

    if (!isBilling && !isShipping) {
      throw new Error(`Unknown address ID format: ${addressId}`);
    }

    // Fetch current customer to merge updates
    const current  = await this.getUserById(userId);
    const existing = current.addresses?.find((a) => a.id === addressId);

    if (!existing) throw new Error(`Address ${addressId} not found`);

    const merged: Address = { ...existing, ...updates, id: addressId };

    const payload: Record<string, any> = {};
    if (isBilling)  payload.billing  = mapAddressToWooBilling(merged, current.email);
    if (isShipping) payload.shipping = mapAddressToWooShipping(merged);

    const res = await fetch(`${WOO_BASE}/customers/${encodeURIComponent(userId)}`, {
      method:  "PUT",
      headers: jsonHeaders(),
      body:    JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await safeJson(res, "updateAddress").catch(() => ({}));
      throw new Error(err?.message ?? `Failed to update address (HTTP ${res.status})`);
    }

    const woo     = await safeJson(res, "updateAddress");
    const updated = mapWooCustomerToAppUser(woo);
    const saved   = updated.addresses?.find((a) => a.id === addressId);

    if (!saved) throw new Error("Address was updated but could not be retrieved");
    return saved;
  }

  /**
   * Deletes an address by clearing its fields in WooCommerce.
   *
   * WooCommerce has no delete endpoint for individual addresses —
   * we blank the fields via PUT on the customer.
   */
  static async deleteAddress(userId: string, addressId: string): Promise<void> {
    const isBilling  = addressId.startsWith("billing_");
    const isShipping = addressId.startsWith("shipping_");

    if (!isBilling && !isShipping) {
      throw new Error(`Unknown address ID format: ${addressId}`);
    }

    const blank = {
      first_name: "", last_name: "",
      address_1: "", address_2: "",
      city: "", state: "", postcode: "", country: "",
      phone: "",
    };

    const payload: Record<string, any> = {};
    if (isBilling)  payload.billing  = blank;
    if (isShipping) payload.shipping = blank;

    const res = await fetch(`${WOO_BASE}/customers/${encodeURIComponent(userId)}`, {
      method:  "PUT",
      headers: jsonHeaders(),
      body:    JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await safeJson(res, "deleteAddress").catch(() => ({}));
      throw new Error(err?.message ?? `Failed to delete address (HTTP ${res.status})`);
    }
  }

  /**
   * Fetches loyalty/reward points.
   *
   * Requires a loyalty plugin — we support:
   *   - WooCommerce Points and Rewards (official)
   *   - YITH WooCommerce Points and Rewards
   *
   * Both store points in user meta accessible via /wp-json/wp/v2/users/:id
   * or via custom REST endpoints the plugins register.
   *
   * If no plugin is installed, returns 0 points with empty history.
   */
  static async getRewards(userId: string): Promise<{ points: number; history: RewardEvent[] }> {
    // Attempt to fetch points from WP user meta
    // The meta key varies by plugin — try both common ones
    const res = await fetch(
      `${WP_BASE}/wp/v2/users/${encodeURIComponent(userId)}?context=edit`,
      { headers: { ...basicAuthHeader() } }
    );

    if (!res.ok) {
      // Non-fatal — return zero if we can't reach the endpoint
      return { points: 0, history: [] };
    }

    const wpUser  = await safeJson(res, "getRewards");
    const meta    = wpUser.meta ?? {};

    // WooCommerce Points and Rewards uses "wc_points_balance"
    // YITH uses "yith_points"
    const points  = parseInt(
      meta.wc_points_balance ?? meta.yith_points ?? "0", 10
    ) || 0;

    // History requires a custom plugin endpoint — return empty if unavailable
    return { points, history: [] };
  }
}