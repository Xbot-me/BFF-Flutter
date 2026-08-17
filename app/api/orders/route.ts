// ============================================================
// app/api/orders/route.ts                      ← REPLACE (add withAuth)
// GET /api/orders
// ============================================================
import { NextResponse } from "next/server";
import { OrderService } from "@/lib/services/order.service";
import { withAuth, AuthedRequest } from "@/lib/utils/auth.middleware";
 
export const GET = withAuth(async (req: AuthedRequest) => {
  try {
    const orders = await OrderService.getOrders(req.user.id);
    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});
 