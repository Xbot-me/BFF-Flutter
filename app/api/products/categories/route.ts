// ============================================================
// app/api/products/categories/route.ts
// GET /api/products/categories
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/lib/services/product.service";
import { getTenantId } from "@/lib/utils/tenant";
 
export async function GET(req: NextRequest) {
  try {
    const categories = await ProductService.getCategories(getTenantId(req));
    return NextResponse.json(
      { success: true, categories },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
