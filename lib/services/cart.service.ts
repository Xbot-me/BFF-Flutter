import { AppCart } from "../models/cart";
import { MockCartProvider } from "../providers/mock/mock.cart";

type P = "MOCK" | "WOO" | "SHOPIFY";
const getProvider = (): P => (process.env.NEXT_PUBLIC_API_SOURCE ?? "MOCK") as P;

export class CartService {

  static async getCart(
    nonce: string,
    cartToken?: string | null,
  ): Promise<AppCart> {
    switch (getProvider()) {
      case "WOO": {
        const { WooCartProvider } = await import("../providers/woocommerce/woo.cart.provider");
        return (await WooCartProvider.getCart(nonce, cartToken)).cart;
      }
      default:
        return MockCartProvider.getCart(cartToken ?? "mock-cart-token");
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
      case "WOO": {
        const { WooCartProvider } = await import("../providers/woocommerce/woo.cart.provider");
        return WooCartProvider.addItem(
          productId, quantity, nonce, cartToken, selectedOptions, variantId
        );
      }
      default: {
        const cart = await MockCartProvider.addItem(
          productId, quantity, selectedOptions, variantId
        );
        return { cart, cartToken: cartToken ?? "mock-cart-token" };
      }
    }
  }

  static async removeItem(
    key: string,
    nonce: string,
    cartToken: string,
  ): Promise<{ cart: AppCart; cartToken: string }> {
    switch (getProvider()) {
      case "WOO": {
        const { WooCartProvider } = await import("../providers/woocommerce/woo.cart.provider");
        return WooCartProvider.removeItem(key, nonce, cartToken);
      }
      default:
        return { cart: await MockCartProvider.removeItem(key), cartToken };
    }
  }

  static async updateItemQuantity(
    key: string,
    quantity: number,
    nonce: string,
    cartToken: string,
  ): Promise<{ cart: AppCart; cartToken: string }> {
    switch (getProvider()) {
      case "WOO": {
        const { WooCartProvider } = await import("../providers/woocommerce/woo.cart.provider");
        return WooCartProvider.updateItemQuantity(key, quantity, nonce, cartToken);
      }
      default:
        return { cart: await MockCartProvider.updateItemQuantity(key, quantity), cartToken };
    }
  }

  static async applyCoupon(
    code: string,
    nonce: string,
    cartToken: string,
  ): Promise<{ cart: AppCart; cartToken: string }> {
    switch (getProvider()) {
      case "WOO": {
        const { WooCartProvider } = await import("../providers/woocommerce/woo.cart.provider");
        return WooCartProvider.applyCoupon(code, nonce, cartToken);
      }
      default:
        return { cart: await MockCartProvider.applyCoupon(code), cartToken };
    }
  }

  static async removeCoupon(
    code: string,
    nonce: string,
    cartToken: string,
  ): Promise<{ cart: AppCart; cartToken: string }> {
    switch (getProvider()) {
      case "WOO": {
        const { WooCartProvider } = await import("../providers/woocommerce/woo.cart.provider");
        return WooCartProvider.removeCoupon(code, nonce, cartToken);
      }
      default:
        return { cart: await MockCartProvider.removeCoupon(code), cartToken };
    }
  }

  static async mergeCarts(
  guestCartToken: string,
  userCartToken:  string | null | undefined,
  nonce:          string,
  userId:         string,
): Promise<AppCart> {
  switch (getProvider()) {
    case "WOO": {
      const { WooCartProvider } = await import("../providers/woocommerce/woo.cart.provider");
      return WooCartProvider.mergeCarts(guestCartToken, userCartToken, nonce);
    }
    default:
      return MockCartProvider.mergeCarts(guestCartToken, userCartToken);
  }
}
}