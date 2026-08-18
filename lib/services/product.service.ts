import { MockProvider } from "../providers/mock/mock.provider";
import { SortOption } from "../models/catalog";
import { ShopifyStorefrontProvider } from "../providers/shopify/shopify.storefront";
import { CacheService } from "./cache.service";

type ProviderType = "MOCK" | "SHOPIFY";

export class ProductService {
  private static getProvider(): ProviderType {
    return (process.env.NEXT_PUBLIC_API_SOURCE || process.env.API_SOURCE || "MOCK").toUpperCase() as ProviderType;
  }

  // --------------------------------------------------------------------------
  // Product list — with pagination, category, sort, stock filter & SWR Caching
  // --------------------------------------------------------------------------
  static async getAllProducts(
    page: number = 1,
    perPage: number = 20,
    category?: string,
    sort: SortOption = "newest",
    inStock?: boolean,
    tenantId?: string | null,
  ) {
    const key = CacheService.key("products", tenantId, page, perPage, category, sort, inStock);

    return CacheService.swr(
      key,
      async () => {
        const p = this.getProvider();
        switch (p) {
          case "SHOPIFY":
            return ShopifyStorefrontProvider.getProducts({ first: perPage, query: category }, tenantId);
          default:
            return MockProvider.getProducts(page, perPage, category, sort, inStock);
        }
      },
      CacheService.TTL.PRODUCTS_LIST
    );
  }

  // --------------------------------------------------------------------------
  // Product detail by ID or slug with SWR Caching
  // --------------------------------------------------------------------------
  static async getProduct(id: string, tenantId?: string | null) {
    const key = CacheService.key("pdp", tenantId, id);

    return CacheService.swr(
      key,
      async () => {
        const p = this.getProvider();
        try {
          switch (p) {
            case "SHOPIFY": {
              const product = await ShopifyStorefrontProvider.getProduct(id, tenantId);
              if (!product) throw new Error(`Product not found: ${id}`);
              return product;
            }
            default:
              return await MockProvider.getProductDetail(id);
          }
        } catch (error) {
          console.error(`[ProductService] getProduct failed id=${id}`, error);
          throw error;
        }
      },
      CacheService.TTL.PRODUCT_DETAIL
    );
  }

  // --------------------------------------------------------------------------
  // Full-text search with SWR Caching
  // --------------------------------------------------------------------------
  static async searchProducts(query: string, page = 1, perPage = 20, tenantId?: string | null) {
    const key = CacheService.key("search", tenantId, query.toLowerCase().trim(), page, perPage);

    return CacheService.swr(
      key,
      async () => {
        const p = this.getProvider();
        switch (p) {
          case "SHOPIFY":
            return ShopifyStorefrontProvider.getProducts({ first: perPage, query }, tenantId).then((result) => ({
              query,
              results: result.products.map((product) => ({ ...product, score: 1 })),
              total: result.total,
              tookMs: 0,
            }));
          default:
            return MockProvider.searchProducts(query, page, perPage);
        }
      },
      CacheService.TTL.SEARCH
    );
  }

  // --------------------------------------------------------------------------
  // Category list with counts with SWR Caching
  // --------------------------------------------------------------------------
  static async getCategories(tenantId?: string | null) {
    const key = CacheService.key("categories", tenantId);

    return CacheService.swr(
      key,
      async () => {
        const p = this.getProvider();
        switch (p) {
          case "SHOPIFY":
            return ShopifyStorefrontProvider.getCategories(tenantId);
          default:
            return MockProvider.getCategories();
        }
      },
      CacheService.TTL.CATEGORIES
    );
  }

  // --------------------------------------------------------------------------
  // Featured products for home screen with SWR Caching
  // --------------------------------------------------------------------------
  static async getFeaturedProducts(tenantId?: string | null) {
    const key = CacheService.key("featured", tenantId);

    return CacheService.swr(
      key,
      async () => {
        const p = this.getProvider();
        switch (p) {
          case "SHOPIFY":
            return ShopifyStorefrontProvider.getProducts({ first: 6, sortKey: "BEST_SELLING" }, tenantId).then((result) => ({
              onSale: result.products.filter((product) => product.onSale),
              topRated: [],
              newArrivals: result.products,
            }));
          default:
            return MockProvider.getFeaturedProducts();
        }
      },
      CacheService.TTL.FEATURED
    );
  }

  // --------------------------------------------------------------------------
  // Related products for product detail screen with SWR Caching
  // --------------------------------------------------------------------------
  static async getRelatedProducts(id: string, tenantId?: string | null) {
    const key = CacheService.key("related", tenantId, id);

    return CacheService.swr(
      key,
      async () => {
        const p = this.getProvider();
        switch (p) {
          case "SHOPIFY":
            return ShopifyStorefrontProvider.getProducts({ first: 4 }, tenantId).then((result) =>
              result.products.filter((product) => product.id !== id),
            );
          default:
            return MockProvider.getRelatedProducts(id);
        }
      },
      CacheService.TTL.PRODUCT_DETAIL
    );
  }
}
