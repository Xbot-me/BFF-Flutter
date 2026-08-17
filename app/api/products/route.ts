// ============================================================
// app/api/products/route.ts
// GET /api/products
// GET /api/products?category=Albums&page=1&perPage=10&sort=price_asc&inStock=true
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/lib/services/product.service";
import { SortOption } from "@/lib/models/catalog";
 
const VALID_SORTS: SortOption[] = ["newest", "oldest", "price_asc", "price_desc", "rating", "name_asc"];
 
export async function GET(req: NextRequest) {
  try {
    const s        = new URL(req.url).searchParams;
    const page     = Math.max(1, Number(s.get("page")    ?? 1));
    const perPage  = Math.min(100, Math.max(1, Number(s.get("perPage") ?? 20)));
    const category = s.get("category") ?? undefined;
    const sortRaw  = s.get("sort") ?? "newest";
    const sort     = VALID_SORTS.includes(sortRaw as SortOption) ? sortRaw as SortOption : "newest";
    const inStock  = s.get("inStock") === "true" ? true : undefined;
 
    const result = await ProductService.getAllProducts(page, perPage, category, sort, inStock);
 
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}