// ============================================================
// app/api/products/featured/route.ts
// GET /api/products/featured
// Returns: { onSale[], topRated[], newArrivals[] }
// ============================================================
import { NextResponse } from "next/server";
import { ProductService } from "@/lib/services/product.service";
 
export async function GET() {
  try {
    const featured = await ProductService.getFeaturedProducts();
    return NextResponse.json({ success: true, ...featured });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}