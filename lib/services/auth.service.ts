import { AppUser } from "../models/user";
import { MockAuthProvider } from "../providers/mock/mock.auth";

type P = "MOCK" | "WOO" | "SHOPIFY";
const getProvider = (): P => (process.env.NEXT_PUBLIC_API_SOURCE ?? "MOCK") as P;

export class AuthService {

  /**
   * Creates a new customer account.
   * WOO  → POST /wc/v3/customers then JWT login
   * MOCK → in-memory user store
   * Returns same { user, token } shape as login — Flutter can go straight
   * to the home screen after signup without a second login call.
   */
  static async signup(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    phone?: string,
  ): Promise<{ user: AppUser; token: string }> {
    console.log(`[AuthService] signup via ${getProvider()}`);
    switch (getProvider()) {
      case "WOO": {
        const { WooAuthProvider } = await import("../providers/woocommerce/woo.auth.provider");
        return WooAuthProvider.signup(email, password, firstName, lastName, phone);
      }
      case "SHOPIFY":
        // const { ShopifyAuthProvider } = await import("../providers/shopify/shopify.auth.provider");
        // return ShopifyAuthProvider.signup(email, password, firstName, lastName, phone);
        throw new Error("Shopify auth provider not implemented yet");
      default:
        return MockAuthProvider.signup(email, password, firstName, lastName, phone);
    }
  }

  static async login(
    email: string,
    password: string,
  ): Promise<{ user: AppUser; token: string }> {
    console.log(`[AuthService] login via ${getProvider()}`);
    switch (getProvider()) {
      case "WOO": {
        const { WooAuthProvider } = await import("../providers/woocommerce/woo.auth.provider");
        return WooAuthProvider.login(email, password);
      }
      case "SHOPIFY":
        throw new Error("Shopify auth provider not implemented yet");
      default:
        return MockAuthProvider.login(email, password);
    }
  }

  static async getUser(token: string): Promise<AppUser> {
    switch (getProvider()) {
      case "WOO": {
        const { WooAuthProvider } = await import("../providers/woocommerce/woo.auth.provider");
        return WooAuthProvider.getUser(token);
      }
      case "SHOPIFY":
        throw new Error("Shopify auth provider not implemented yet");
      default:
        return MockAuthProvider.getUser(token);
    }
  }

  static async logout(token: string): Promise<void> {
    switch (getProvider()) {
      case "WOO": {
        const { WooAuthProvider } = await import("../providers/woocommerce/woo.auth.provider");
        return WooAuthProvider.logout(token);
      }
      case "SHOPIFY":
        throw new Error("Shopify auth provider not implemented yet");
      default:
        return MockAuthProvider.logout();
    }
  }
}