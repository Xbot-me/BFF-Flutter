// ============================================================
// app/api/products/[id]/related/route.ts
// GET /api/products/:id/related
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/lib/services/product.service";
 
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id }    = await params;
    const related   = await ProductService.getRelatedProducts(id);
    return NextResponse.json({ success: true, related });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}