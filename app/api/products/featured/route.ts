// ============================================================
// app/api/products/featured/route.ts
// GET /api/products/featured
// Returns: { onSale[], topRated[], newArrivals[] }
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/lib/services/product.service";
import { getTenantId } from "@/lib/utils/tenant";
 
export async function GET(req: NextRequest) {
  try {
    const featured = await ProductService.getFeaturedProducts(getTenantId(req));
    return NextResponse.json(
      { success: true, ...featured },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
