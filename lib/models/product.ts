export type ProductType = "simple" | "variable" | "grouped" | "external";
export type StockStatus = "instock" | "outofstock" | "backorder";

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
}

export interface ProductVariant {
  id: string;
  sku: string;                              // FIX: was missing — mapper always emits it
  price: number;
  selectedOptions: Record<string, string>;  // FIX: renamed from `attributes` — matches Shopify's selectedOptions shape
  stockStatus: StockStatus;
  stockQuantity: number;                    // FIX: was missing — needed by Flutter for stock display + cart logic
  image?: ProductImage;
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  type: ProductType;
  price: number;
  priceRange?: { min: number; max: number }; // FIX: was missing — mapper computed it but model didn't declare it
  regularPrice: number;
  salePrice?: number;
  onSale: boolean;
  stockStatus: StockStatus;
  stockQuantity?: number | null;
  featuredImage: ProductImage;
  category: string;
  averageRating: number;
  createdAt: string;                         // FIX: was missing — mapper emitted it, schema stripped it
  updatedAt: string;                         // FIX: was missing — mapper emitted it, schema stripped it
}

export interface ProductDetail extends ProductSummary {
  description: string;
  shortDescription: string;
  images: ProductImage[];
  weight?: string;
  dimensions?: {
    length: string;
    width: string;
    height: string;
  };
  seo?: {
    title: string;
    description: string;
  };

  // Universal terminology — maps cleanly to both WooCommerce attributes and Shopify options
  options?: {
    name: string;
    values: string[];
  }[];

  variants?: ProductVariant[];              // FIX: now uses the shared ProductVariant interface

  relatedIds?: string[];
  groupedIds?: string[];
  externalUrl?: string;
  buttonText?: string;
}