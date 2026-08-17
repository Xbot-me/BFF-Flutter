import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/shopify/test
 * Body: { storeDomain: "your-store.myshopify.com", storefrontAccessToken: "..." }
 * Tests Shopify Storefront GraphQL connectivity.
 */
export async function POST(req: NextRequest) {
  try {
    const { storeDomain, storefrontAccessToken } = await req.json();

    if (!storeDomain || !storefrontAccessToken) {
      return NextResponse.json(
        { success: false, error: "Both storeDomain and storefrontAccessToken are required" },
        { status: 400 }
      );
    }

    // Clean domain format
    const domain = storeDomain.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    const endpoint = `https://${domain}/api/2024-04/graphql.json`;

    const query = `
      query TestStorefrontConnection {
        shop {
          name
          description
          primaryDomain {
            url
            host
          }
          paymentSettings {
            currencyCode
            acceptedCardBrands
          }
        }
      }
    `;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontAccessToken.trim(),
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          success: false,
          status: response.status,
          error: `Shopify responded with HTTP ${response.status}: ${errorText.substring(0, 300)}`,
        },
        { status: 400 }
      );
    }

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: data.errors.map((e: any) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      shop: data.data?.shop,
      message: `Successfully connected to Shopify store "${data.data?.shop?.name}"!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to connect: ${err.message}`,
      },
      { status: 500 }
    );
  }
}
