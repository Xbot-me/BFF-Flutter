import { MockProvider } from "../providers/mock/mock.provider";
import { SortOption } from "../models/catalog";
import { ShopifyStorefrontProvider } from "../providers/shopify/shopify.storefront";

type ProviderType = "MOCK" | "SHOPIFY";

export class ProductService {

  private static getProvider(): ProviderType {
    return (process.env.NEXT_PUBLIC_API_SOURCE || process.env.API_SOURCE || "MOCK").toUpperCase() as ProviderType;
  }

  // --------------------------------------------------------------------------
  // Product list — with pagination, category, sort, stock filter
  // --------------------------------------------------------------------------
  static async getAllProducts(
    page:     number     = 1,
    perPage:  number     = 20,
    category?: string,
    sort:     SortOption = "newest",
    inStock?: boolean,
    tenantId?: string | null,
  ) {
    const p = this.getProvider();
    console.log(`[ProductService] getAllProducts source=${p} page=${page} perPage=${perPage} category=${category ?? "all"} sort=${sort}`);
    switch (p) {
      case "SHOPIFY":
        return ShopifyStorefrontProvider.getProducts({ first: perPage, query: category }, tenantId);
      default:
        return MockProvider.getProducts(page, perPage, category, sort, inStock);
    }
  }

  // --------------------------------------------------------------------------
  // Product detail by ID or slug
  // --------------------------------------------------------------------------
  static async getProduct(id: string, tenantId?: string | null) {
    const p = this.getProvider();
    console.log(`[ProductService] getProduct source=${p} id=${id}`);
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
  }

  // --------------------------------------------------------------------------
  // Full-text search
  // --------------------------------------------------------------------------
  static async searchProducts(query: string, page = 1, perPage = 20, tenantId?: string | null) {
    const p = this.getProvider();
    console.log(`[ProductService] search source=${p} q="${query}"`);
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
  }

  // --------------------------------------------------------------------------
  // Category list with counts
  // --------------------------------------------------------------------------
  static async getCategories(tenantId?: string | null) {
    const p = this.getProvider();
    console.log(`[ProductService] getCategories source=${p}`);
    switch (p) {
      case "SHOPIFY":
        return ShopifyStorefrontProvider.getCategories(tenantId);
      default:
        return MockProvider.getCategories();
    }
  }

  // --------------------------------------------------------------------------
  // Featured products for home screen
  // --------------------------------------------------------------------------
  static async getFeaturedProducts(tenantId?: string | null) {
    const p = this.getProvider();
    console.log(`[ProductService] getFeaturedProducts source=${p}`);
    switch (p) {
      case "SHOPIFY":
        return ShopifyStorefrontProvider.getProducts({ first: 6, sortKey: "BEST_SELLING" }, tenantId).then((result) => ({
          // Shopify Storefront does not expose ratings through this BFF, so do
          // not claim a separate top-rated list until a verified reviews source
          // is integrated.
          onSale: result.products.filter((product) => product.onSale),
          topRated: [],
          newArrivals: result.products,
        }));
      default:
        return MockProvider.getFeaturedProducts();
    }
  }

  // --------------------------------------------------------------------------
  // Related products for product detail screen
  // --------------------------------------------------------------------------
  static async getRelatedProducts(id: string, tenantId?: string | null) {
    const p = this.getProvider();
    console.log(`[ProductService] getRelatedProducts source=${p} id=${id}`);
    switch (p) {
      case "SHOPIFY":
        return ShopifyStorefrontProvider.getProducts({ first: 4 }, tenantId).then((result) =>
          result.products.filter((product) => product.id !== id),
        );
      default:
        return MockProvider.getRelatedProducts(id);
    }
  }
}
