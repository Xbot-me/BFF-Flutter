// ============================================================
// app/api/checkout/shipping/select/route.ts
// POST /api/checkout/shipping/select
// Flutter calls this after the user picks a shipping rate.
// BFF tells WooCommerce which rate was selected so totals
// recalculate correctly before checkout/process is called.
//
// Body: { rateId: "usps_priority_mail", cartToken: "..." }
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { ShippingService } from "@/lib/services/shipping.service";
 
export async function POST(req: NextRequest) {
  try {
    const { rateId, cartToken } = await req.json();
 
    if (!rateId || !cartToken) {
      return NextResponse.json(
        { success: false, error: "rateId and cartToken are required" },
        { status: 400 }
      );
    }
 
    const selectedRate = await ShippingService.selectRate(rateId, cartToken);
 
    return NextResponse.json({ success: true, selectedRate });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}