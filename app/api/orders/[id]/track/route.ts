import { NextResponse } from "next/server";
import { withAuth, AuthedRequest } from "@/lib/utils/auth.middleware";
import { OrderService } from "@/lib/services/order.service";

// GET /api/orders/:id/track
export const GET = withAuth(async (
  _req: AuthedRequest,
  { params }: { params: Promise<Record<string, string>> },
) => {
  try {
    const { id }   = await params;
    // FIX: OrderService uses static methods — call directly, never use `new OrderService()`
    const tracking = await OrderService.getTracking(id);
    return NextResponse.json({ success: true, tracking });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
});