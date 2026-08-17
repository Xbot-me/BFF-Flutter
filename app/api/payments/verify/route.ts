import { NextRequest, NextResponse } from "next/server";
import { MockStoreService } from "@/lib/providers/mock/mock.store";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ success: false }, { status: 400 });

  const status = MockStoreService.getStatus(orderId);

  return NextResponse.json({
    success: true,
    orderId,
    status, // "pending" or "processing" (if paid)
  });
}