import { TenantConfig } from "@/lib/models/tenant";
import { TenantService } from "@/lib/services/tenant.service";

export interface ShopifyGraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; locations?: any[]; path?: string[] }>;
}

export class ShopifyClient {
  private domain: string;
  private token: string;
  private apiVersion = "2024-04";

  constructor(domain?: string, token?: string) {
    this.domain = (domain || process.env.SHOPIFY_STORE_DOMAIN || "")
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "");
    this.token = (token || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "").trim();
  }

  static fromTenant(tenantId?: string | null): ShopifyClient {
    const tenant: TenantConfig = TenantService.getTenant(tenantId);
    return new ShopifyClient(
      tenant.shopifyStoreDomain || process.env.SHOPIFY_STORE_DOMAIN,
      tenant.storefrontAccessToken || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
    );
  }

  get isConfigured(): boolean {
    return Boolean(this.domain && this.token);
  }

  async query<T = any>(query: string, variables: Record<string, any> = {}): Promise<T> {
    if (!this.isConfigured) {
      throw new Error("Shopify Storefront credentials are not configured for this tenant.");
    }

    const endpoint = `https://${this.domain}/api/${this.apiVersion}/graphql.json`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": this.token,
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 30 }, // Next.js cache
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Shopify API error HTTP ${res.status}: ${errText.substring(0, 300)}`);
    }

    const json: ShopifyGraphQLResponse<T> = await res.json();

    if (json.errors && json.errors.length > 0) {
      const msg = json.errors.map((e) => e.message).join(", ");
      throw new Error(`Shopify GraphQL Error: ${msg}`);
    }

    if (!json.data) {
      throw new Error("Empty data returned from Shopify Storefront API");
    }

    return json.data;
  }
}
