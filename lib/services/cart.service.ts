import { AppCart } from "../models/cart";
import { MockCartProvider } from "../providers/mock/mock.cart";
import { ShopifyStorefrontProvider } from "../providers/shopify/shopify.storefront";

type P = "MOCK" | "SHOPIFY";
const getProvider = (): P => (process.env.NEXT_PUBLIC_API_SOURCE ?? "MOCK").toUpperCase() as P;

export class CartService {

  static async getCart(
    nonce: string,
    cartToken?: string | null,
  ): Promise<AppCart> {
    switch (getProvider()) {
      case "SHOPIFY":
        return cartToken
          ? ShopifyStorefrontProvider.getCart(cartToken)
          : ShopifyStorefrontProvider.createCart([]);
      default:
        return MockCartProvider.getCart(cartToken ?? `mock-cart-${crypto.randomUUID()}`);
    }
  }

  /**
   * variantId   — the resolved variant ID from Flutter's findVariant() call.
   *               When present, used directly as the Store API item ID (Woo)
   *               or to short-circuit selectedOptions lookup (Mock).
   *
   * selectedOptions — always required for variable products.
   *               Used for display (CartItemOption[]) and as a fallback
   *               when variantId is absent.
   */
  static async addItem(
    productId: string,
    quantity: number,
    nonce: string,
    cartToken?: string | null,
    selectedOptions?: Record<string, string>,
    variantId?: string,
  ): Promise<{ cart: AppCart; cartToken: string }> {
    switch (getProvider()) {
      case "SHOPIFY": {
        const product = variantId ? null : await ShopifyStorefrontProvider.getProduct(productId);
        const merchandiseId = variantId ?? product?.variants?.[0]?.id;
        if (!merchandiseId) throw new Error("A purchasable product variant is required");
        const cart = await ShopifyStorefrontProvider.addCartLine(cartToken, merchandiseId, quantity);
        return { cart, cartToken: cart.cartToken };
      }
      default: {
        const token = cartToken ?? `mock-cart-${crypto.randomUUID()}`;
        const cart = await MockCartProvider.addItem(
          productId, quantity, selectedOptions, variantId, token
        );
        return { cart, cartToken: token };
      }
    }
  }

  static async removeItem(
    key: string,
    nonce: string,
    cartToken: string,
  ): Promise<{ cart: AppCart; cartToken: string }> {
    switch (getProvider()) {
      case "SHOPIFY": {
        const cart = await ShopifyStorefrontProvider.removeCartLine(cartToken, key);
        return { cart, cartToken: cart.cartToken };
      }
      default:
        return { cart: await MockCartProvider.removeItem(key, cartToken), cartToken };
    }
  }

  static async updateItemQuantity(
    key: string,
    quantity: number,
    nonce: string,
    cartToken: string,
  ): Promise<{ cart: AppCart; cartToken: string }> {
    switch (getProvider()) {
      case "SHOPIFY": {
        const cart = await ShopifyStorefrontProvider.updateCartLine(cartToken, key, quantity);
        return { cart, cartToken: cart.cartToken };
      }
      default:
        return { cart: await MockCartProvider.updateItemQuantity(key, quantity, cartToken), cartToken };
    }
  }

  static async applyCoupon(
    code: string,
    nonce: string,
    cartToken: string,
  ): Promise<{ cart: AppCart; cartToken: string }> {
    switch (getProvider()) {
      case "SHOPIFY": {
        const existing = await ShopifyStorefrontProvider.getCart(cartToken);
        const cart = await ShopifyStorefrontProvider.updateDiscountCodes(cartToken, [...existing.coupons.map((coupon) => coupon.code), code]);
        return { cart, cartToken: cart.cartToken };
      }
      default:
        return { cart: await MockCartProvider.applyCoupon(code, cartToken), cartToken };
    }
  }

  static async removeCoupon(
    code: string,
    nonce: string,
    cartToken: string,
  ): Promise<{ cart: AppCart; cartToken: string }> {
    switch (getProvider()) {
      case "SHOPIFY": {
        const existing = await ShopifyStorefrontProvider.getCart(cartToken);
        const cart = await ShopifyStorefrontProvider.updateDiscountCodes(cartToken, existing.coupons.filter((coupon) => coupon.code.toUpperCase() !== code.toUpperCase()).map((coupon) => coupon.code));
        return { cart, cartToken: cart.cartToken };
      }
      default:
        return { cart: await MockCartProvider.removeCoupon(code, cartToken), cartToken };
    }
  }

  static async mergeCarts(
    guestCartToken: string,
    userCartToken:  string | null | undefined,
    nonce:          string,
    userId:         string,
  ): Promise<AppCart> {
    switch (getProvider()) {
      default:
        return MockCartProvider.mergeCarts(guestCartToken, userCartToken);
    }
  }

  static async clearCart(cartToken?: string | null): Promise<AppCart> {
    switch (getProvider()) {
      case "SHOPIFY":
        if (!cartToken) throw new Error("Cart-Token is required");
        return ShopifyStorefrontProvider.clearCart(cartToken);
      default:
        MockCartProvider.resetCart(cartToken ?? "mock-cart-token");
        return MockCartProvider.getCart(cartToken ?? `mock-cart-${crypto.randomUUID()}`);
    }
  }
}
