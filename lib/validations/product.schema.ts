import { z } from 'zod';

const ImageSchema = z.object({
  id: z.string().or(z.number()).transform(v => v.toString()),
  url: z.string().url(),
  alt: z.string().default(''),
});

// FIX: Extracted as a named schema so it can be reused and tested independently
const VariantSchema = z.object({
  id: z.string().or(z.number()).transform(v => v.toString()),
  sku: z.string().default(''),                              // FIX: was missing — Zod was silently stripping it
  price: z.coerce.number(),
  selectedOptions: z.record(z.string()),                    // FIX: renamed from `attributes` to match mapper output and Shopify terminology
  stockStatus: z.enum(["instock", "outofstock", "backorder"]),
  stockQuantity: z.coerce.number().default(0),              // FIX: was missing — Zod was silently stripping it
  image: ImageSchema.optional(),
});

export const ProductSummarySchema = z.object({
  id: z.string().or(z.number()).transform(v => v.toString()),
  slug: z.string(),
  name: z.string(),
  type: z.enum(["simple", "variable", "grouped", "external"]),
  price: z.coerce.number(),
  priceRange: z.object({                                    // FIX: was missing — mapper computed it but schema stripped it
    min: z.number(),
    max: z.number(),
  }).optional(),
  regularPrice: z.coerce.number(),
  salePrice: z.coerce.number().optional(),
  onSale: z.boolean(),
  stockStatus: z.enum(["instock", "outofstock", "backorder"]).default("instock"),
  stockQuantity: z.number().nullable().optional(),
  featuredImage: ImageSchema,
  category: z.string().default("Uncategorized"),
  averageRating: z.coerce.number().default(0),
  createdAt: z.string().default(() => new Date().toISOString()),  // FIX: was missing — now survives Zod parse
  updatedAt: z.string().default(() => new Date().toISOString()),  // FIX: was missing — now survives Zod parse
});

export const ProductDetailSchema = ProductSummarySchema.extend({
  description: z.string().default(''),
  shortDescription: z.string().default(''),
  images: z.array(ImageSchema),
  weight: z.string().optional(),
  dimensions: z.object({
    length: z.string(),
    width: z.string(),
    height: z.string(),
  }).optional(),
  seo: z.object({
    title: z.string(),
    description: z.string(),
  }).optional(),
  options: z.array(z.object({
    name: z.string(),
    values: z.array(z.string()),
  })).optional(),
  variants: z.array(VariantSchema).optional(),              // FIX: uses the shared VariantSchema above
  relatedIds: z.array(z.string()).optional(),
  groupedIds: z.array(z.string()).optional(),
  externalUrl: z.string().url().optional(),
  buttonText: z.string().optional(),
});

// Export types inferred from schemas — single source of truth for runtime shapes
export type ProductSummaryFromSchema = z.infer<typeof ProductSummarySchema>;
export type ProductDetailFromSchema = z.infer<typeof ProductDetailSchema>;
export type VariantFromSchema = z.infer<typeof VariantSchema>;