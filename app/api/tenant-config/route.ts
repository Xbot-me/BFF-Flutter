import { NextRequest, NextResponse } from "next/server";
import { TenantService } from "@/lib/services/tenant.service";

/**
 * GET /api/tenant-config
 *
 * Header: X-Tenant-Id: <slug or id> (optional)
 * Query:  ?tenant=<slug or id>     (optional)
 *
 * Returns the theme branding tokens and feature toggles for the tenant.
 */
export async function GET(req: NextRequest) {
  try {
    const headerTenant = req.headers.get("X-Tenant-Id");
    const queryTenant  = req.nextUrl.searchParams.get("tenant");
    const tenantId     = headerTenant || queryTenant || null;

    const config = TenantService.getTenant(tenantId);

    // Return safe configuration (masking sensitive tokens)
    const publicConfig = {
      id: config.id,
      slug: config.slug,
      name: config.name,
      hasShopifyConfigured: Boolean(config.shopifyStoreDomain && config.storefrontAccessToken),
      themePreset: config.themePreset,
      branding: config.branding,
      features: config.features,
      updatedAt: config.updatedAt,
    };

    return NextResponse.json({
      success: true,
      tenant: publicConfig,
    }, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60",
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
