import { ProductDetail, ProductSummary, ProductImage, ProductVariant } from "../../models/product";

/**
 * HELPER: Safely maps images, providing fallbacks if WooCommerce data is broken.
 */
const mapImage = (img: any, fallbackAlt: string): ProductImage => ({
  id: img?.id?.toString() || `fallback-${Math.random()}`,
  url: img?.src || "https://placehold.co/600x600/111/fff?text=No+Image",
  alt: img?.alt || fallbackAlt,
});

/**
 * HELPER: Safely parses dimensions, as Woo often leaves these blank.
 */
const mapDimensions = (dim: any) => ({
  length: dim?.length || "0",
  width: dim?.width || "0",
  height: dim?.height || "0",
});

/**
 * HELPER: Strips HTML tags from WooCommerce short_description.
 * Woo returns short_description wrapped in <p> tags — Flutter doesn't want raw HTML.
 */
const stripHtml = (html: string): string =>
  html.replace(/(<([^>]+)>)/gi, "").trim();

/**
 * INDUSTRY STANDARD ADAPTER:
 * Translates Woo JSON -> BFF Domain Schema
 */
export function transformWooProduct(
  woo: any,
  mode: "summary" | "detail",
  variations: any[] = []
): ProductSummary | ProductDetail {

  // 1. Calculate Price Range (crucial for variable products)
  let minPrice = parseFloat(woo.price || "0");
  let maxPrice = minPrice;
  if (woo.type === "variable" && variations.length > 0) {
    const prices = variations.map(v => parseFloat(v.price || "0"));
    minPrice = Math.min(...prices);
    maxPrice = Math.max(...prices);
  }

  // 2. Base Mapping (used for both Summary and Detail)
  const baseData: ProductSummary = {
    id: woo.id.toString(),
    slug: woo.slug,
    name: woo.name,
    type: woo.type as any,
    price: minPrice,
    priceRange: woo.type === "variable" ? { min: minPrice, max: maxPrice } : undefined, // FIX: now declared in model
    regularPrice: parseFloat(woo.regular_price || "0"),
    salePrice: woo.sale_price ? parseFloat(woo.sale_price) : undefined,
    onSale: woo.on_sale,
    stockStatus: woo.stock_status,
    stockQuantity: woo.stock_quantity ?? null,
    featuredImage: mapImage(woo.images?.[0], woo.name),
    category: woo.categories?.[0]?.name || "Uncategorized",
    averageRating: parseFloat(woo.average_rating || "0"),
    createdAt: woo.date_created_gmt || new Date().toISOString(),  // FIX: now declared in model
    updatedAt: woo.date_modified_gmt || new Date().toISOString(), // FIX: now declared in model
  };

  // Return early for list view — keeps bandwidth minimal
  if (mode === "summary") return baseData;

  // 3. Detail Mapping (heavy data, SEO, and variants)
  return {
    ...baseData,
    description: woo.description || "",
    shortDescription: stripHtml(woo.short_description || ""), // FIX: strip HTML tags before sending to Flutter
    images: woo.images?.map((img: any) => mapImage(img, woo.name)) || [],
    weight: woo.weight || "0",
    dimensions: mapDimensions(woo.dimensions),

    // SEO translation (assumes Yoast, with safe fallbacks)
    seo: {
      title: woo.yoast_head_json?.title || woo.name,
      description: woo.yoast_head_json?.description || stripHtml(woo.short_description || ""),
    },

    // Options: lowercase names for safe cross-platform mapping
    options: woo.attributes?.map((attr: any) => ({
      name: attr.name.toLowerCase(),
      values: attr.options,
    })) || [],

    // Variants: the most critical mapping
    // FIX: field renamed from `selectedOptions` -> now consistently `selectedOptions`
    //      matching the model's ProductVariant interface and Shopify terminology
    variants: variations.map((v: any): ProductVariant => ({
      id: v.id.toString(),
      sku: v.sku || `SKU-${v.id}`,                    // FIX: now included — was in mapper before but model didn't declare it
      price: parseFloat(v.price || "0"),
      selectedOptions: v.attributes.reduce((acc: any, attr: any) => {
        acc[attr.name.toLowerCase()] = attr.option;   // lowercase for cross-platform safety
        return acc;
      }, {}),
      stockStatus: v.stock_status,
      stockQuantity: v.stock_quantity ?? 0,            // FIX: now included — ?? preserves 0 correctly
      image: v.image ? mapImage(v.image, `${woo.name} Variant`) : undefined,
    })),

    relatedIds: woo.related_ids?.map((id: any) => id.toString()) || [],
    groupedIds: woo.grouped_products?.map((id: any) => id.toString()) || [],
    externalUrl: woo.external_url || undefined,
    buttonText: woo.button_text || undefined,
  };
}