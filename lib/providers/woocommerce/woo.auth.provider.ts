import { AppUser } from "../../models/user";

// Required plugins:
//   JWT Authentication for WP REST API
//   https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/
//
// .env vars:
//   WOOCOMMERCE_URL     — e.g. https://yourstore.com
//   WOOCOMMERCE_KEY     — consumer key
//   WOOCOMMERCE_SECRET  — consumer secret

const WP_BASE  = `${process.env.WOOCOMMERCE_URL}/wp-json`;
const WOO_BASE = `${process.env.WOOCOMMERCE_URL}/wp-json/wc/v3`;

// ---------------------------------------------------------------------------
// Shared mapper — WooCommerce customer → AppUser
// Used by login, signup, and getUser
// ---------------------------------------------------------------------------

function mapWooCustomerToAppUser(woo: any): AppUser {
  return {
    id:           String(woo.id),
    email:        woo.email         ?? "",
    firstName:    woo.first_name    || undefined,
    lastName:     woo.last_name     || undefined,
    displayName:  woo.username      || undefined,
    phone:        woo.billing?.phone || undefined,
    rewardPoints: 0,
    isGuest:      false,
    isVerified:   true,
    createdAt:    woo.date_created_gmt  || undefined,
    updatedAt:    woo.date_modified_gmt || undefined,
    addresses: [
      ...(woo.billing?.address_1 ? [{
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
      }] : []),
      ...(woo.shipping?.address_1 ? [{
        id:                `shipping_${woo.id}`,
        firstName:         woo.shipping.first_name || undefined,
        lastName:          woo.shipping.last_name  || undefined,
        address1:          woo.shipping.address_1,
        address2:          woo.shipping.address_2  || undefined,
        city:              woo.shipping.city,
        state:             woo.shipping.state       || undefined,
        postcode:          woo.shipping.postcode,
        country:           woo.shipping.country,
        phone:             woo.billing.phone        || undefined,
        isDefaultBilling:  false,
        isDefaultShipping: true,
      }] : []),
    ],
    defaultBillingAddressId:  woo.billing?.address_1  ? `billing_${woo.id}`  : undefined,
    defaultShippingAddressId: woo.shipping?.address_1 ? `shipping_${woo.id}` : undefined,
  };
}

// ---------------------------------------------------------------------------
// Basic auth header — required for all /wc/v3 calls
// WC REST API v3 does not accept JWT — needs consumer key + secret
// ---------------------------------------------------------------------------

function basicAuthHeader(): Record<string, string> {
  const credentials = Buffer.from(
    `${process.env.WOOCOMMERCE_KEY}:${process.env.WOOCOMMERCE_SECRET}`
  ).toString("base64");
  return { Authorization: `Basic ${credentials}` };
}

// ---------------------------------------------------------------------------
// Helper: get JWT token for a given email/password
// ---------------------------------------------------------------------------

async function getJwtToken(email: string, password: string): Promise<string> {
  const res = await fetch(`${WP_BASE}/jwt-auth/v1/token`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ username: email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Authentication failed");
  }

  const data = await res.json();
  if (!data.token) throw new Error("No token returned from WooCommerce");
  return data.token;
}

// ---------------------------------------------------------------------------
// WooAuthProvider — mirrors MockAuthProvider interface exactly
// ---------------------------------------------------------------------------

export class WooAuthProvider {

  /**
   * Creates a new WooCommerce customer via /wc/v3/customers (basic auth),
   * then immediately logs in to get a JWT so Flutter can start a session.
   *
   * WooCommerce signup flow:
   *   1. POST /wc/v3/customers          → creates customer, returns customer object
   *   2. POST /jwt-auth/v1/token        → exchanges email+password for JWT
   *   3. Return { user: AppUser, token }
   *
   * Shopify equivalent (future):
   *   mutation customerCreate { ... }   → creates customer
   *   mutation customerAccessTokenCreate → gets access token
   *   Same { user, token } shape returned
   */
  static async signup(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    phone?: string,
  ): Promise<{ user: AppUser; token: string }> {

    // 1. Create customer in WooCommerce
    const createRes = await fetch(`${WOO_BASE}/customers`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        ...basicAuthHeader(),
      },
      body: JSON.stringify({
        email,
        password,
        first_name: firstName ?? "",
        last_name:  lastName  ?? "",
        username:   email,    // WooCommerce requires username — use email as default
        billing: {
          email,
          first_name: firstName ?? "",
          last_name:  lastName  ?? "",
          phone:      phone     ?? "",
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      // WooCommerce returns code "registration-error-email-exists" for duplicates
      if (err?.code === "registration-error-email-exists") {
        throw new Error("An account with this email already exists");
      }
      throw new Error(err?.message ?? "Failed to create account");
    }

    const newCustomer = await createRes.json();

    // 2. Get JWT for the newly created customer
    const token = await getJwtToken(email, password);

    return { user: mapWooCustomerToAppUser(newCustomer), token };
  }

  /**
   * WooCommerce login flow:
   *   1. POST /jwt-auth/v1/token        → get JWT
   *   2. GET  /wc/v3/customers?email=X  → fetch customer record
   *   3. Return { user: AppUser, token }
   */
  static async login(
    email: string,
    password: string,
  ): Promise<{ user: AppUser; token: string }> {

    // 1. Get JWT
    const token = await getJwtToken(email, password);

    // 2. Fetch WooCommerce customer record
    const custRes = await fetch(
      `${WOO_BASE}/customers?email=${encodeURIComponent(email)}&per_page=1`,
      { headers: { ...basicAuthHeader() } }
    );

    if (!custRes.ok) throw new Error("Failed to fetch customer data");
    const customers = await custRes.json();
    if (!customers?.length) throw new Error("Customer not found");

    return { user: mapWooCustomerToAppUser(customers[0]), token };
  }

  /**
   * Validates JWT then fetches fresh customer data.
   */
  static async getUser(token: string): Promise<AppUser> {

    // 1. Validate token
    const validateRes = await fetch(`${WP_BASE}/jwt-auth/v1/token/validate`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!validateRes.ok) throw new Error("Invalid or expired token");

    // 2. Get WP user ID from /wp/v2/users/me
    const meRes = await fetch(`${WP_BASE}/wp/v2/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) throw new Error("Failed to fetch user profile");
    const wpUser = await meRes.json();

    // 3. Fetch WooCommerce customer by WP user ID
    const custRes = await fetch(`${WOO_BASE}/customers/${wpUser.id}`, {
      headers: { ...basicAuthHeader() },
    });
    if (!custRes.ok) throw new Error("Failed to fetch WooCommerce customer");

    return mapWooCustomerToAppUser(await custRes.json());
  }

  static async logout(_token: string): Promise<void> {
    // JWT is stateless — client discards the token.
    // Add a denylist call here if you install a JWT blocklist plugin.
  }


  // ADD to WooAuthProvider:
static async forgotPassword(email: string): Promise<void> {
  // WooCommerce uses the standard WP password reset mechanism.
  // The /wp-login.php?action=lostpassword endpoint is not a REST API —
  // we trigger it via the wp/v2 endpoint if available, or a custom plugin.
  //
  // Option A: Use a password reset plugin that exposes a REST endpoint
  // Option B: POST to /wp-login.php (not recommended for headless)
  // Option C: Use WooCommerce's built-in email trigger via /wc/v3/customers
  //
  // Implementation depends on which plugin is installed.
  // Most setups use "WP REST API - Lost Password" plugin:
  const res = await fetch(`${WP_BASE}/wp/v2/users/lostpassword`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email }),
  });
 
  // Silently succeed regardless — prevents user enumeration
  if (!res.ok) {
    console.warn(`[WooAuth] forgotPassword: endpoint returned ${res.status}`);
  }
}
 
static async resetPassword(token: string, newPassword: string): Promise<void> {
  // Reset token is sent via email by WooCommerce/WordPress.
  // The token format is: key=XXX&login=YYY (WP standard).
  // This endpoint depends on your reset plugin.
  //
  // Example with "WP REST API Password Reset" plugin:
  const res = await fetch(`${WP_BASE}/bdpwr/v1/reset-password`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ code: token, password: newPassword }),
  });
 
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Failed to reset password");
  }
}

}