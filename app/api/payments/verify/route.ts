import { NextResponse } from "next/server";
import { MockStoreService } from "@/lib/providers/mock/mock.store";
import { withOptionalAuth, OptionalAuthRequest } from "@/lib/utils/auth.middleware";

export const GET = withOptionalAuth(async (req: OptionalAuthRequest) => {
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ success: false }, { status: 400 });

  const status = MockStoreService.getStatus(orderId);

  return NextResponse.json({
    success: true,
    orderId,
    status, // "pending" or "processing" (if paid)
  });
});