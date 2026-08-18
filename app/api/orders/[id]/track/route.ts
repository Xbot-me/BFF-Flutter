import { NextResponse } from "next/server";
import { withAuth, AuthedRequest } from "@/lib/utils/auth.middleware";
import { OrderService } from "@/lib/services/order.service";

// GET /api/orders/:id/track
export const GET = withAuth(async (
  req: AuthedRequest,
  { params }: { params: Promise<Record<string, string>> },
) => {
  try {
    const { id }   = await params;
    const order = await OrderService.getOrderById(id);
    if (order.billingAddress.email?.toLowerCase() !== req.user.email.toLowerCase()) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    const tracking = await OrderService.getTracking(id);
    return NextResponse.json({ success: true, tracking });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});
