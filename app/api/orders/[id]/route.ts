// ============================================================
// app/api/orders/[id]/route.ts                 ← REPLACE (add withAuth)
// GET /api/orders/:id
// ============================================================
import { NextResponse } from "next/server";
import { OrderService } from "@/lib/services/order.service";
import { withAuth, AuthedRequest } from "@/lib/utils/auth.middleware";

export const GET = withAuth(async (
  req: AuthedRequest,
  { params }: { params: Promise<Record<string, string>> },
) => {
  try {
    const { id } = await params;
    const order = await OrderService.getOrderById(id);
    if (order.billingAddress.email?.toLowerCase() !== req.user.email.toLowerCase()) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, order });
  } catch {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }
});
