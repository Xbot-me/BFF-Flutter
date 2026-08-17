import { MockProvider } from "../providers/mock/mock.provider";
import { WooCommerceProvider } from "../providers/woocommerce/woo.provider";
import { SortOption } from "../models/catalog";
// import { ShopifyProvider } from "../providers/shopify/shopify.provider";

type ProviderType = "MOCK" | "WOO" | "SHOPIFY";

export class ProductService {

  private static getProvider(): ProviderType {
    return (process.env.NEXT_PUBLIC_API_SOURCE || "MOCK") as ProviderType;
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
  ) {
    const p = this.getProvider();
    console.log(`[ProductService] getAllProducts source=${p} page=${page} perPage=${perPage} category=${category ?? "all"} sort=${sort}`);
    switch (p) {
      case "WOO":     return WooCommerceProvider.getProducts(page, perPage, category, sort, inStock);
      case "SHOPIFY": throw new Error("Shopify provider not implemented yet");
      default:        return MockProvider.getProducts(page, perPage, category, sort, inStock);
    }
  }

  // --------------------------------------------------------------------------
  // Product detail by ID or slug
  // --------------------------------------------------------------------------
  static async getProduct(id: string) {
    const p = this.getProvider();
    console.log(`[ProductService] getProduct source=${p} id=${id}`);
    try {
      switch (p) {
        case "WOO":     return await WooCommerceProvider.getProductDetail(id);
        case "SHOPIFY": throw new Error("Shopify provider not implemented yet");
        default:        return await MockProvider.getProductDetail(id);
      }
    } catch (error) {
      console.error(`[ProductService] getProduct failed id=${id}`, error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Full-text search
  // --------------------------------------------------------------------------
  static async searchProducts(query: string, page = 1, perPage = 20) {
    const p = this.getProvider();
    console.log(`[ProductService] search source=${p} q="${query}"`);
    switch (p) {
      case "WOO":     return WooCommerceProvider.searchProducts(query, page, perPage);
      case "SHOPIFY": throw new Error("Shopify provider not implemented yet");
      default:        return MockProvider.searchProducts(query, page, perPage);
    }
  }

  // --------------------------------------------------------------------------
  // Category list with counts
  // --------------------------------------------------------------------------
  static async getCategories() {
    const p = this.getProvider();
    console.log(`[ProductService] getCategories source=${p}`);
    switch (p) {
      case "WOO":     return WooCommerceProvider.getCategories();
      case "SHOPIFY": throw new Error("Shopify provider not implemented yet");
      default:        return MockProvider.getCategories();
    }
  }

  // --------------------------------------------------------------------------
  // Featured products for home screen
  // --------------------------------------------------------------------------
  static async getFeaturedProducts() {
    const p = this.getProvider();
    console.log(`[ProductService] getFeaturedProducts source=${p}`);
    switch (p) {
      case "WOO":     return WooCommerceProvider.getFeaturedProducts();
      case "SHOPIFY": throw new Error("Shopify provider not implemented yet");
      default:        return MockProvider.getFeaturedProducts();
    }
  }

  // --------------------------------------------------------------------------
  // Related products for product detail screen
  // --------------------------------------------------------------------------
  static async getRelatedProducts(id: string) {
    const p = this.getProvider();
    console.log(`[ProductService] getRelatedProducts source=${p} id=${id}`);
    switch (p) {
      case "WOO":     return WooCommerceProvider.getRelatedProducts(id);
      case "SHOPIFY": throw new Error("Shopify provider not implemented yet");
      default:        return MockProvider.getRelatedProducts(id);
    }
  }
}