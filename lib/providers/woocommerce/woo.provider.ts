import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import { ProductDetail, ProductSummary } from "../../models/product";
import { ProductDetailSchema } from "../../validations/product.schema";
import {
  PaginatedProducts,
  ProductCategory,
  ProductSearchResult,
  SearchResponse,
  SortOption,
} from "../../models/catalog";
import { transformWooProduct } from "./woo.mapper";

// ---------------------------------------------------------------------------
// Sort param mapping — BFF SortOption → WooCommerce REST API orderby/order
// ---------------------------------------------------------------------------

const WOO_SORT_MAP: Record<SortOption, { orderby: string; order: string }> = {
  newest:     { orderby: "date",       order: "desc" },
  oldest:     { orderby: "date",       order: "asc"  },
  price_asc:  { orderby: "price",      order: "asc"  },
  price_desc: { orderby: "price",      order: "desc" },
  rating:     { orderby: "rating",     order: "desc" },
  name_asc:   { orderby: "title",      order: "asc"  },
};

// ---------------------------------------------------------------------------
// WooCommerceProvider
// ---------------------------------------------------------------------------

export class WooCommerceProvider {
  private static api = new WooCommerceRestApi({
    url:            process.env.WOOCOMMERCE_URL!,
    consumerKey:    process.env.WOOCOMMERCE_KEY!,
    consumerSecret: process.env.WOOCOMMERCE_SECRET!,
    version:        "wc/v3",
  });

  // --------------------------------------------------------------------------
  // Product list
  // --------------------------------------------------------------------------
  static async getProducts(
    page:     number     = 1,
    perPage:  number     = 20,
    category?: string,
    sort:     SortOption = "newest",
    inStock?: boolean,
  ): Promise<PaginatedProducts> {
    try {
      const params: Record<string, any> = {
        page,
        per_page: perPage,
        status:   "publish",
        ...WOO_SORT_MAP[sort],
      };

      if (category) {
        const catRes = await this.api.get("products/categories", {
          search: category, per_page: 1,
        });
        const match = catRes.data?.[0];
        if (match) params.category = match.id;
      }

      if (inStock) params.stock_status = "instock";

      const response   = await this.api.get("products", params);
      const totalCount = parseInt(response.headers?.["x-wp-total"] ?? "0", 10);
      const totalPages = parseInt(response.headers?.["x-wp-totalpages"] ?? "1", 10);

      return {
        products:    response.data.map((item: any) => transformWooProduct(item, "summary") as ProductSummary),
        total:       totalCount,
        page,
        perPage,
        totalPages,
        hasNextPage: page < totalPages,
      };
    } catch (error: any) {
      console.error("[WooCommerceProvider.getProducts]:", error.response?.data || error.message);
      throw new Error("Failed to fetch products from WooCommerce");
    }
  }

  // --------------------------------------------------------------------------
  // Product detail
  // --------------------------------------------------------------------------
  static async getProductDetail(id: string): Promise<ProductDetail> {
    try {
      const response   = await this.api.get(`products/${id}`);
      const rawProduct = response.data;

      let variations: any[] = [];
      if (rawProduct.type === "variable") {
        const varRes = await this.api.get(`products/${id}/variations`, { per_page: 100 });
        variations   = varRes.data;
      }

      const cleanData     = transformWooProduct(rawProduct, "detail", variations);
      const validatedData = ProductDetailSchema.parse(cleanData);
      return validatedData as ProductDetail;
    } catch (error: any) {
      console.error(`[WooCommerceProvider.getProductDetail id=${id}]:`, error.message);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Search — WooCommerce REST search + score simulation
  // --------------------------------------------------------------------------
  static async searchProducts(
    query:   string,
    page:    number = 1,
    perPage: number = 20,
  ): Promise<SearchResponse> {
    const startMs = Date.now();
    try {
      const response   = await this.api.get("products", {
        search:   query,
        page,
        per_page: perPage,
        status:   "publish",
      });
      const totalCount = parseInt(response.headers?.["x-wp-total"] ?? "0", 10);

      const results: ProductSearchResult[] = response.data.map((item: any, idx: number) => ({
        ...(transformWooProduct(item, "summary") as ProductSummary),
        // WooCommerce doesn't return relevance scores — simulate descending score by position
        score: parseFloat((1 - idx * 0.05).toFixed(2)),
      }));

      return {
        query,
        results,
        total:  totalCount,
        tookMs: Date.now() - startMs,
      };
    } catch (error: any) {
      console.error("[WooCommerceProvider.searchProducts]:", error.message);
      throw new Error("Search failed");
    }
  }

  // --------------------------------------------------------------------------
  // Categories
  // --------------------------------------------------------------------------
  static async getCategories(): Promise<ProductCategory[]> {
    try {
      const response = await this.api.get("products/categories", {
        per_page: 100,
        hide_empty: true,
        orderby: "count",
        order:   "desc",
      });

      return response.data.map((cat: any): ProductCategory => ({
        name:        cat.name,
        slug:        cat.slug,
        count:       cat.count,
        description: cat.description || "",
      }));
    } catch (error: any) {
      console.error("[WooCommerceProvider.getCategories]:", error.message);
      throw new Error("Failed to fetch categories");
    }
  }

  // --------------------------------------------------------------------------
  // Featured products
  // --------------------------------------------------------------------------
  static async getFeaturedProducts(): Promise<{
    onSale:      ProductSummary[];
    topRated:    ProductSummary[];
    newArrivals: ProductSummary[];
  }> {
    try {
      const [saleRes, ratedRes, newRes] = await Promise.all([
        this.api.get("products", { on_sale: true,  per_page: 6, status: "publish" }),
        this.api.get("products", { orderby: "rating", order: "desc", per_page: 6, status: "publish" }),
        this.api.get("products", { orderby: "date",   order: "desc", per_page: 6, status: "publish" }),
      ]);

      return {
        onSale:      saleRes.data.map((i: any)  => transformWooProduct(i, "summary") as ProductSummary),
        topRated:    ratedRes.data.map((i: any) => transformWooProduct(i, "summary") as ProductSummary),
        newArrivals: newRes.data.map((i: any)   => transformWooProduct(i, "summary") as ProductSummary),
      };
    } catch (error: any) {
      console.error("[WooCommerceProvider.getFeaturedProducts]:", error.message);
      throw new Error("Failed to fetch featured products");
    }
  }

  // --------------------------------------------------------------------------
  // Related products
  // --------------------------------------------------------------------------
  static async getRelatedProducts(id: string): Promise<ProductSummary[]> {
    try {
      // 1. Get the product to read its related_ids
      const response   = await this.api.get(`products/${id}`);
      const relatedIds = response.data.related_ids as number[];

      if (!relatedIds?.length) {
        // Fallback: products in the same category
        const catId = response.data.categories?.[0]?.id;
        if (!catId) return [];
        const fallback = await this.api.get("products", {
          category: catId, per_page: 4, exclude: [id], status: "publish",
        });
        return fallback.data.map((i: any) => transformWooProduct(i, "summary") as ProductSummary);
      }

      // 2. Fetch each related product — use include[] param for efficiency
      const related = await this.api.get("products", {
        include:  relatedIds,
        per_page: relatedIds.length,
        status:   "publish",
      });

      return related.data.map((i: any) => transformWooProduct(i, "summary") as ProductSummary);
    } catch (error: any) {
      console.error(`[WooCommerceProvider.getRelatedProducts id=${id}]:`, error.message);
      throw new Error("Failed to fetch related products");
    }
  }
}