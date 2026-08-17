import { NextRequest, NextResponse } from "next/server";
import { MockStoreService } from "@/lib/providers/mock/mock.store";
import { AuthorizeNetService, HOSTED_URL } from "@/lib/services/authorizenet";

export async function POST(req: NextRequest) {
  try {
    // 🔴 FIX: Extract "billing", not "billingAddress"
    const { amount, billing } = await req.json();

    const orderId = MockStoreService.createOrder(amount);

    // Pass 'billing' to the service
    const token = await AuthorizeNetService.getHostedPaymentToken(orderId, amount, billing);

    return NextResponse.json({
      success: true,
      orderId,
      hostedPaymentUrl: "https://test.authorize.net/payment/payment",
      paymentToken: token,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}