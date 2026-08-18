 
// ============================================================
// app/api/products/[id]/route.ts
// GET /api/products/:id
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/lib/services/product.service";
import { getTenantId } from "@/lib/utils/tenant";
 
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await ProductService.getProduct(id, getTenantId(_req));
    return NextResponse.json({ success: true, product });
  } catch {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }
}
