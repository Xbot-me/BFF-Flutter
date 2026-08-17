// ============================================================
// app/api/cart/guest/route.ts
// POST /api/cart/guest
// Initialises an empty cart session and returns a Cart-Token.
// Flutter calls this on app launch so it has a token ready before
// the user adds their first item.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { CartService } from "@/lib/services/cart.service";

export async function POST(req: NextRequest){
    try{
        const nonce = req.headers.get("Nonce") ?? "";
        const cart = await CartService.getCart(nonce,null);
        const res = NextResponse.json({success: true, cart}, {status: 201});
        res.headers.set("Cart-Token",cart.cartToken);

        return res;
    }catch(err: any){
        return NextResponse.json({success:false, error: err.message}, {status:500});
    }
}