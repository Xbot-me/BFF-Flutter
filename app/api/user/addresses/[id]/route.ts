// ============================================================
// app/api/user/addresses/[id]/route.ts         ← NEW
// PUT    /api/user/addresses/:id  — update address
// DELETE /api/user/addresses/:id  — delete address
// ============================================================
import { NextResponse } from "next/server";
import { UserService } from "@/lib/services/user.service";
import { withAuth, AuthedRequest } from "@/lib/utils/auth.middleware";

export const PUT = withAuth(async (
    req: AuthedRequest,
    { params }: { params: Promise<Record<string, string>> },
) => {
    try {
        const { id } = await params;
        const body = await req.json();
        const address = await UserService.updateAddress(req.user.id, id, body);
        return NextResponse.json({ success: true, address });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
});

export const DELETE = withAuth(async (
    req: AuthedRequest,
    { params }: { params: Promise<Record<string, string>> },
) => {
    try {
        const { id } = await params;
        await UserService.deleteAddress(req.user.id, id);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
});