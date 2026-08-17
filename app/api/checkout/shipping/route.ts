// ============================================================
// app/api/checkout/shipping/route.ts
// POST /api/checkout/shipping
// Body: { addressId, cartToken }
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { ShippingService } from "@/lib/services/shipping.service";
import { UserService } from "@/lib/services/user.service";
 
export async function POST(req: NextRequest) {
  try {
    const { addressId, cartToken } = await req.json();
    if (!addressId || !cartToken) {
      return NextResponse.json({ success: false, error: "addressId and cartToken are required" }, { status: 400 });
    }
    const address = await UserService.getAddressById(addressId);
    if (!address) return NextResponse.json({ success: false, error: "Address not found" }, { status: 404 });
 
    const rates = await ShippingService.getRates(addressId, cartToken);
    return NextResponse.json({
      success: true,
      destinationSummary: `${address.city}, ${address.state || address.country} ${address.postcode}`,
      rates,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Could not calculate shipping" }, { status: 500 });
  }
}