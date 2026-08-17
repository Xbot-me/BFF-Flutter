// ============================================================
// app/api/checkout/process/route.ts
// POST /api/checkout/process
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { CheckoutRequestSchema } from "@/lib/validations/checkout.schema";
import { PaymentService } from "@/lib/services/payment.service";
import { withOptionalAuth, OptionalAuthRequest } from "@/lib/utils/auth.middleware";

const idempotencyCache = new Map<string, { result: any; timestamp: number }>();

export const POST = withOptionalAuth(async (req: OptionalAuthRequest) => {
  const idempotencyKey = req.headers.get("X-Idempotency-Key");

  if (idempotencyKey) {
    const cached = idempotencyCache.get(idempotencyKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      const statusMap: Record<string, number> = { success: 200, payment_error: 402, validation_error: 422, network_error: 503, server_error: 500 };
      return NextResponse.json(cached.result, { status: cached.result.type ? (statusMap[cached.result.type] ?? 500) : (cached.result.success ? 200 : 500) });
    }
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ success: false, type: "validation_error", message: "Invalid JSON" }, { status: 400 }); }
 
  let input;
  try { input = CheckoutRequestSchema.parse(body); }
  catch (err) {
    if (err instanceof ZodError) {
      const fields = err.issues.reduce<Record<string, string>>((acc, e) => { acc[e.path.join(".")] = e.message; return acc; }, {});
      return NextResponse.json({ success: false, type: "validation_error", message: "Validation failed", details: { fields } }, { status: 422 });
    }
    return NextResponse.json({ success: false, type: "validation_error", message: "Invalid request" }, { status: 400 });
  }
 
  try {
    const result = await PaymentService.processCheckout(input);
    const statusMap: Record<string, number> = { success: 200, payment_error: 402, validation_error: 422, network_error: 503, server_error: 500 };
    
    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, { result, timestamp: Date.now() });
    }

    return NextResponse.json(result, { status: result.type ? (statusMap[result.type] ?? 500) : (result.success ? 200 : 500) });
  } catch (err: any) {
    console.error("[checkout/process]", err.message);
    return NextResponse.json({ success: false, type: "server_error", message: "An unexpected error occurred" }, { status: 500 });
  }
});