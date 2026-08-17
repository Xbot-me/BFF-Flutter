import { NextRequest, NextResponse } from "next/server";
import { TenantService } from "@/lib/services/tenant.service";
import { TenantConfigSchema } from "@/lib/models/tenant";

/**
 * GET /api/admin/tenants
 * Lists all registered merchant tenants.
 */
export async function GET() {
  try {
    const tenants = TenantService.getAllTenants();
    return NextResponse.json({
      success: true,
      tenants,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tenants
 * Creates or updates a tenant configuration.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = TenantConfigSchema.partial().parse(body);

    if (!parsed.id || !parsed.name) {
      return NextResponse.json(
        { success: false, error: "Tenant 'id' and 'name' are required" },
        { status: 400 }
      );
    }

    const saved = TenantService.saveTenant({
      id: parsed.id,
      name: parsed.name,
      ...parsed,
    });

    return NextResponse.json({
      success: true,
      tenant: saved,
      message: "Tenant configuration saved successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}
