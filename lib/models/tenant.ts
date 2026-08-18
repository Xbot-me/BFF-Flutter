import { z } from "zod";

export type ThemePreset =
  | "bold_dark"
  | "minimal_light"
  | "editorial_serif"
  | "playful_neon"
  | "custom";

export interface BrandingConfig {
  appTitle: string;
  tagline: string;
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: number;
}

export interface TenantFeatures {
  enableApplePay: boolean;
  enableGooglePay: boolean;
  enableReviews: boolean;
  enableWishlist: boolean;
  enableLoyaltyRewards: boolean;
  enableOrderTracking: boolean;
}

export interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  shopifyStoreDomain: string;
  storefrontAccessToken: string;
  themePreset: ThemePreset;
  branding: BrandingConfig;
  features: TenantFeatures;
  createdAt: string;
  updatedAt: string;
}

export const BrandingConfigSchema = z.object({
  appTitle: z.string().min(1),
  tagline: z.string().default(""),
  logoUrl: z.string().default(""),
  bannerUrl: z.string().default(""),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  secondaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  backgroundColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  surfaceColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  textColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
  fontFamily: z.string().default("Cinzel"),
  borderRadius: z.number().default(16),
});

export const TenantFeaturesSchema = z.object({
  enableApplePay: z.boolean().default(true),
  enableGooglePay: z.boolean().default(true),
  enableReviews: z.boolean().default(true),
  enableWishlist: z.boolean().default(true),
  enableLoyaltyRewards: z.boolean().default(true),
  enableOrderTracking: z.boolean().default(true),
});

export const TenantConfigSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  shopifyStoreDomain: z.string().default(""),
  storefrontAccessToken: z.string().default(""),
  themePreset: z.enum([
    "bold_dark",
    "minimal_light",
    "editorial_serif",
    "playful_neon",
    "custom",
  ]).default("bold_dark"),
  branding: BrandingConfigSchema,
  features: TenantFeaturesSchema.default({
    enableApplePay: true,
    enableGooglePay: true,
    enableReviews: true,
    enableWishlist: true,
    enableLoyaltyRewards: true,
    enableOrderTracking: true,
  }),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const THEME_PRESETS: Record<ThemePreset, Partial<BrandingConfig>> = {
  bold_dark: {
    primaryColor: "#D7BAFF",
    secondaryColor: "#FFB1C7",
    backgroundColor: "#050505",
    surfaceColor: "#131313",
    textColor: "#E5E2E1",
    fontFamily: "Cinzel",
    borderRadius: 16,
  },
  minimal_light: {
    primaryColor: "#111111",
    secondaryColor: "#666666",
    backgroundColor: "#FAFAFA",
    surfaceColor: "#FFFFFF",
    textColor: "#111111",
    fontFamily: "Inter",
    borderRadius: 12,
  },
  editorial_serif: {
    primaryColor: "#8B1E1E",
    secondaryColor: "#C59B27",
    backgroundColor: "#FBF9F5",
    surfaceColor: "#FFFFFF",
    textColor: "#1A1817",
    fontFamily: "Playfair Display",
    borderRadius: 8,
  },
  playful_neon: {
    primaryColor: "#FF007F",
    secondaryColor: "#00F5D4",
    backgroundColor: "#0D0221",
    surfaceColor: "#1A0933",
    textColor: "#FFFFFF",
    fontFamily: "Montserrat",
    borderRadius: 20,
  },
  custom: {},
};
