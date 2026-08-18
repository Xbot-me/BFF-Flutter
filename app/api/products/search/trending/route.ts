// ============================================================
// app/api/products/search/trending/route.ts
// GET /api/products/search/trending?timeframe=recent|daily|monthly
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { CacheService } from "@/lib/services/cache.service";
import { getTenantId } from "@/lib/utils/tenant";

export interface TrendingItem {
  query: string;
  rank: number;
  isHot?: boolean;
  tag?: string;
  category?: string;
  searchCount?: number;
}

const TRENDING_DATA: Record<string, TrendingItem[]> = {
  recent: [
    { query: "BORN PINK Vinyl", rank: 1, isHot: true, tag: "🔥 TRENDING", category: "Albums", searchCount: 1420 },
    { query: "Official Lightstick V2", rank: 2, isHot: true, tag: "+45%", category: "Gear", searchCount: 1180 },
    { query: "Aespa Armageddon", rank: 3, isHot: true, tag: "NEW", category: "Albums", searchCount: 940 },
    { query: "NewJeans Bunny Bag", rank: 4, isHot: false, tag: "+28%", category: "Merch", searchCount: 760 },
    { query: "Stray Kids 5-STAR Limited", rank: 5, isHot: false, tag: "+15%", category: "Albums", searchCount: 620 },
    { query: "SEVENTEEN FML Carat", rank: 6, isHot: false, category: "Albums", searchCount: 510 },
  ],
  daily: [
    { query: "Official Lightstick V2", rank: 1, isHot: true, tag: "#1 TODAY", category: "Gear", searchCount: 4890 },
    { query: "Special Album Dawn/Dusk", rank: 2, isHot: true, tag: "BEST SELLER", category: "Albums", searchCount: 3950 },
    { query: "BTS World Tour Hoodie", rank: 3, isHot: false, tag: "+32%", category: "Apparel", searchCount: 3120 },
    { query: "Photocard Binder 9-Pocket", rank: 4, isHot: false, category: "Accessories", searchCount: 2780 },
    { query: "IVE SWITCH Photobook", rank: 5, isHot: false, category: "Albums", searchCount: 2310 },
    { query: "TXT Minisode 3", rank: 6, isHot: false, category: "Albums", searchCount: 1980 },
  ],
  monthly: [
    { query: "Official Lightstick V2", rank: 1, isHot: true, tag: "TOP 1", category: "Gear", searchCount: 42300 },
    { query: "Photocard Collection Set", rank: 2, isHot: true, tag: "POPULAR", category: "Accessories", searchCount: 36500 },
    { query: "Special Album Dawn/Dusk", rank: 3, isHot: false, tag: "CLASSIC", category: "Albums", searchCount: 29800 },
    { query: "World Tour Oversized Hoodie", rank: 4, isHot: false, category: "Apparel", searchCount: 25400 },
    { query: "Vinyl LP Gatefold Edition", rank: 5, isHot: false, category: "Albums", searchCount: 21900 },
    { query: "Acrylic Standee & Keychain", rank: 6, isHot: false, category: "Merch", searchCount: 18400 },
  ],
};

export async function GET(req: NextRequest) {
  try {
    const s = new URL(req.url).searchParams;
    const timeframe = (s.get("timeframe") || "recent").toLowerCase();
    const tenantId = getTenantId(req);

    const items = TRENDING_DATA[timeframe] || TRENDING_DATA.recent;

    return NextResponse.json({
      success: true,
      timeframe,
      results: items,
      total: items.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
