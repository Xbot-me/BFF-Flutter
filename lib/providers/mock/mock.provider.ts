import { ProductDetail, ProductSummary } from "../../models/product";
import {
  PaginatedProducts,
  ProductCategory,
  ProductSearchResult,
  SearchResponse,
  SortOption,
} from "../../models/catalog";
import { MOCK_PRODUCTS } from "./mock.data";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

function toSummary(p: ProductDetail): ProductSummary {
  return {
    id:            p.id,
    slug:          p.slug,
    name:          p.name,
    type:          p.type,
    price:         p.price,
    priceRange:    p.priceRange,
    regularPrice:  p.regularPrice,
    salePrice:     p.salePrice,
    onSale:        p.onSale,
    stockStatus:   p.stockStatus,
    stockQuantity: p.stockQuantity,
    featuredImage: p.featuredImage,
    category:      p.category,
    averageRating: p.averageRating,
    createdAt:     p.createdAt,
    updatedAt:     p.updatedAt,
  };
}

function applySort(products: ProductDetail[], sort: SortOption): ProductDetail[] {
  const copy = [...products];
  switch (sort) {
    case "newest":    return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "oldest":    return copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    case "price_asc": return copy.sort((a, b) => a.price - b.price);
    case "price_desc":return copy.sort((a, b) => b.price - a.price);
    case "rating":    return copy.sort((a, b) => b.averageRating - a.averageRating);
    case "name_asc":  return copy.sort((a, b) => a.name.localeCompare(b.name));
    default:          return copy;
  }
}

function paginate(
  products: ProductDetail[],
  page: number,
  perPage: number,
): PaginatedProducts {
  const total      = products.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start      = (page - 1) * perPage;
  const paged      = products.slice(start, start + perPage);

  return {
    products:    paged.map(toSummary),
    total,
    page,
    perPage,
    totalPages,
    hasNextPage: page < totalPages,
  };
}

// ---------------------------------------------------------------------------
// MockProvider
// ---------------------------------------------------------------------------

export class MockProvider {

  // --------------------------------------------------------------------------
  // GET /api/products
  // Supports: page, perPage, category, sort, inStock
  // --------------------------------------------------------------------------
  static async getProducts(
    page:     number      = 1,
    perPage:  number      = 20,
    category?: string,
    sort:     SortOption  = "newest",
    inStock?: boolean,
  ): Promise<PaginatedProducts> {
    await delay(600);

    let products = MOCK_PRODUCTS;

    if (category) {
      const lower = category.toLowerCase();
      products = products.filter((p) => p.category.toLowerCase() === lower);
    }

    if (inStock) {
      products = products.filter((p) => p.stockStatus !== "outofstock");
    }

    products = applySort(products, sort);

    return paginate(products, page, perPage);
  }

  // --------------------------------------------------------------------------
  // GET /api/products/[id]
  // --------------------------------------------------------------------------
  static async getProductDetail(id: string): Promise<ProductDetail> {
    await delay(400);
    const product = MOCK_PRODUCTS.find((p) => p.id === id || p.slug === id);
    if (!product) throw new Error(`Product with ID "${id}" not found`);
    return product;
  }

  // --------------------------------------------------------------------------
  // GET /api/products/search?q=...
  // Searches: name, description, shortDescription, category, SKU (variant)
  // Returns results sorted by relevance score descending
  // --------------------------------------------------------------------------
  static async searchProducts(
    query:   string,
    page:    number = 1,
    perPage: number = 20,
  ): Promise<SearchResponse> {
    const startMs = Date.now();
    await delay(300); // search feels faster than a full list load

    const q = query.toLowerCase().trim();

    if (!q) {
      return { query, results: [], total: 0, tookMs: Date.now() - startMs };
    }

    const terms = q.split(/\s+/); // split "lightstick v2" → ["lightstick", "v2"]

    const scored: ProductSearchResult[] = MOCK_PRODUCTS
      .map((p) => {
        // Build searchable text fields with different weights
        const fields = [
          { text: p.name,             weight: 4 },
          { text: p.shortDescription, weight: 2 },
          { text: p.description,      weight: 1 },
          { text: p.category,         weight: 2 },
          { text: p.slug,             weight: 1 },
          // Search SKUs inside variants
          ...(p.variants?.map((v) => ({ text: v.sku, weight: 3 })) ?? []),
        ];

        let score = 0;
        for (const term of terms) {
          for (const field of fields) {
            if (field.text?.toLowerCase().includes(term)) {
              score += field.weight;
            }
          }
        }

        return { ...toSummary(p), score };
      })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score);

    // Normalise score to 0–1
    const maxScore = scored[0]?.score ?? 1;
    const normalised = scored.map((p) => ({
      ...p,
      score: parseFloat((p.score / maxScore).toFixed(2)),
    }));

    const total  = normalised.length;
    const start  = (page - 1) * perPage;
    const paged  = normalised.slice(start, start + perPage);

    return {
      query,
      results: paged,
      total,
      tookMs: Date.now() - startMs,
    };
  }

  // --------------------------------------------------------------------------
  // GET /api/products/categories
  // Returns all categories with product counts
  // --------------------------------------------------------------------------
  static async getCategories(): Promise<ProductCategory[]> {
    await delay(300);

    const counts = new Map<string, number>();
    for (const p of MOCK_PRODUCTS) {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }

    const categories: ProductCategory[] = Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        slug:        name.toLowerCase().replace(/\s+/g, "-"),
        count,
        description: "",
      }))
      .sort((a, b) => b.count - a.count); // most products first

    return categories;
  }

  // --------------------------------------------------------------------------
  // GET /api/products/featured
  // Returns on-sale products and highest-rated products for home screen
  // --------------------------------------------------------------------------
  static async getFeaturedProducts(): Promise<{
    onSale:     ProductSummary[];
    topRated:   ProductSummary[];
    newArrivals: ProductSummary[];
  }> {
    await delay(400);

    const onSale = MOCK_PRODUCTS
      .filter((p) => p.onSale && p.stockStatus !== "outofstock")
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 6)
      .map(toSummary);

    const topRated = MOCK_PRODUCTS
      .filter((p) => p.averageRating > 0 && p.stockStatus !== "outofstock")
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 6)
      .map(toSummary);

    const newArrivals = [...MOCK_PRODUCTS]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 6)
      .map(toSummary);

    return { onSale, topRated, newArrivals };
  }

  // --------------------------------------------------------------------------
  // GET /api/products/[id]/related
  // Resolves relatedIds to full ProductSummary objects
  // --------------------------------------------------------------------------
  static async getRelatedProducts(id: string): Promise<ProductSummary[]> {
    await delay(300);

    const product = MOCK_PRODUCTS.find((p) => p.id === id);
    if (!product) throw new Error(`Product with ID "${id}" not found`);

    const relatedIds = product.relatedIds ?? [];

    if (relatedIds.length === 0) {
      // Fallback: return other products in the same category
      return MOCK_PRODUCTS
        .filter((p) => p.id !== id && p.category === product.category)
        .slice(0, 4)
        .map(toSummary);
    }

    return MOCK_PRODUCTS
      .filter((p) => relatedIds.includes(p.id))
      .map(toSummary);
  }
}