import fs from "fs";
import path from "path";
import { TenantConfig, ThemePreset, BrandingConfig, THEME_PRESETS } from "../models/tenant";

const DATA_DIR = path.join(process.cwd(), "data");
const TENANTS_FILE = path.join(DATA_DIR, "tenants.json");

const DEFAULT_TENANTS: TenantConfig[] = [
  {
    id: "k-luxe",
    slug: "k-luxe",
    name: "K-LUXE Premium Merch",
    shopifyStoreDomain: process.env.SHOPIFY_STORE_DOMAIN || "",
    storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "",
    themePreset: "bold_dark",
    branding: {
      appTitle: "K-LUXE",
      tagline: "Official K-Pop Merchandise & Collectibles",
      logoUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/08/e7/c8/08e7c854-fdaa-f7c2-7551-a98e226f9809/25UMGIM90866.rgb.jpg/600x600bb.jpg",
      bannerUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB5UZQXZWtopR0Vgkws9ZAdl2mcicBYFguCLRwHpJmfkBO34EpVxsaJ6y8AQfdvyv2-bpZv-QckiXN1IreG4dzdzzM2kCqxWV9_bqy900s4662KJ4uAmlgCntdxu2-wSw9gMiafXE9CeIvs9GSYHyJJp1wp8FBIc1bitpWS71nvbCjT37KKKYw0vjaMTEUEAI3GcGydcvo6sFKh-ekIuKPc4DZ-4MTEA-L-l_cr-oZYN6uyLJPWbn3PZoNPLE2957XrH-xtUnj1JTQ",
      primaryColor: "#D7BAFF",
      secondaryColor: "#FFB1C7",
      backgroundColor: "#050505",
      surfaceColor: "#131313",
      textColor: "#E5E2E1",
      fontFamily: "Cinzel",
      borderRadius: 16,
    },
    features: {
      enableApplePay: true,
      enableGooglePay: true,
      enableReviews: true,
      enableWishlist: true,
      enableLoyaltyRewards: true,
      enableOrderTracking: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "monsta-x-official",
    slug: "monsta-x",
    name: "MONSTA X Official Store",
    shopifyStoreDomain: "",
    storefrontAccessToken: "",
    themePreset: "playful_neon",
    branding: {
      appTitle: "MONSTA X",
      tagline: "Exclusive Tour Merch & Limited Vinyl",
      logoUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/02/c5/18/02c518f5-ac06-3321-622e-08d9429fd968/192562556672_Cover.jpg/600x600bb.jpg",
      bannerUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop",
      primaryColor: "#FF007F",
      secondaryColor: "#00F5D4",
      backgroundColor: "#0D0221",
      surfaceColor: "#1A0933",
      textColor: "#FFFFFF",
      fontFamily: "Montserrat",
      borderRadius: 20,
    },
    features: {
      enableApplePay: true,
      enableGooglePay: true,
      enableReviews: true,
      enableWishlist: true,
      enableLoyaltyRewards: true,
      enableOrderTracking: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export class TenantService {
  private static cache: Map<string, TenantConfig> = new Map();
  private static initialized = false;

  private static ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private static load(): void {
    if (this.initialized) return;

    try {
      this.ensureDataDir();
      if (fs.existsSync(TENANTS_FILE)) {
        const raw = fs.readFileSync(TENANTS_FILE, "utf-8");
        const list: TenantConfig[] = JSON.parse(raw);
        this.cache.clear();
        for (const t of list) {
          this.cache.set(t.id, t);
        }
      } else {
        this.cache.clear();
        for (const t of DEFAULT_TENANTS) {
          this.cache.set(t.id, t);
        }
        this.save();
      }
    } catch (err) {
      console.error("[TenantService] Error loading tenants.json, falling back to defaults", err);
      this.cache.clear();
      for (const t of DEFAULT_TENANTS) {
        this.cache.set(t.id, t);
      }
    }

    this.initialized = true;
  }

  private static save(): void {
    try {
      this.ensureDataDir();
      const list = Array.from(this.cache.values());
      fs.writeFileSync(TENANTS_FILE, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.error("[TenantService] Error saving tenants.json", err);
    }
  }

  static getAllTenants(): TenantConfig[] {
    this.load();
    return Array.from(this.cache.values());
  }

  static getTenant(idOrSlug?: string | null): TenantConfig {
    this.load();
    if (!idOrSlug) {
      return this.cache.get("k-luxe") || Array.from(this.cache.values())[0];
    }

    const byId = this.cache.get(idOrSlug);
    if (byId) return byId;

    const bySlug = Array.from(this.cache.values()).find((t) => t.slug === idOrSlug);
    if (bySlug) return bySlug;

    return this.cache.get("k-luxe") || Array.from(this.cache.values())[0];
  }

  static saveTenant(tenant: Partial<TenantConfig> & { id: string; name: string }): TenantConfig {
    this.load();
    const existing = this.cache.get(tenant.id) || {
      id: tenant.id,
      slug: tenant.slug || tenant.id.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      name: tenant.name,
      shopifyStoreDomain: "",
      storefrontAccessToken: "",
      themePreset: "bold_dark" as ThemePreset,
      branding: {
        appTitle: tenant.name,
        tagline: "",
        logoUrl: "",
        bannerUrl: "",
        primaryColor: "#E5A93C",
        secondaryColor: "#9D4EDD",
        backgroundColor: "#0A0A0C",
        surfaceColor: "#16161A",
        textColor: "#F4F4F6",
        fontFamily: "Cinzel",
        borderRadius: 16,
      },
      features: {
        enableApplePay: true,
        enableGooglePay: true,
        enableReviews: true,
        enableWishlist: true,
        enableLoyaltyRewards: true,
        enableOrderTracking: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated: TenantConfig = {
      ...existing,
      ...tenant,
      branding: {
        ...existing.branding,
        ...(tenant.branding || {}),
      },
      features: {
        ...existing.features,
        ...(tenant.features || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    this.cache.set(updated.id, updated);
    this.save();
    try {
      // Invalidate all cached data for this tenant
      const { CacheService } = require("./cache.service");
      CacheService.invalidate(updated.id);
    } catch (_) {}
    return updated;
  }

  static deleteTenant(id: string): boolean {
    this.load();
    if (id === "k-luxe") return false; // Prevent deleting default primary tenant
    const deleted = this.cache.delete(id);
    if (deleted) {
      this.save();
      try {
        const { CacheService } = require("./cache.service");
        CacheService.invalidate(id);
      } catch (_) {}
    }
    return deleted;
  }
}
