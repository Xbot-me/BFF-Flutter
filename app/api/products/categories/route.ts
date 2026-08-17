// ============================================================
// app/api/products/categories/route.ts
// GET /api/products/categories
// ============================================================
import { NextResponse } from "next/server";
import { ProductService } from "@/lib/services/product.service";
 
export async function GET() {
  try {
    const categories = await ProductService.getCategories();
    return NextResponse.json({ success: true, categories });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}