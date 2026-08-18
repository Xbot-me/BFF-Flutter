// ============================================================
// app/api/products/search/route.ts
// GET /api/products/search?q=lightstick&page=1&perPage=10
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/lib/services/product.service";
import { getTenantId } from "@/lib/utils/tenant";
export async function GET(req: NextRequest) {
  try {
    const s       = new URL(req.url).searchParams;
    const query   = s.get("q")?.trim() ?? "";
    const page    = Math.max(1, Number(s.get("page")    ?? 1));
    const perPage = Math.min(50,  Math.max(1, Number(s.get("perPage") ?? 20)));

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Search query (q) is required" },
        { status: 400 }
      );
    }

    const result = await ProductService.searchProducts(query, page, perPage, getTenantId(req));
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

