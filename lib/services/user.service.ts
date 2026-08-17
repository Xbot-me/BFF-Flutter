import { AppUser, Address } from "../models/user";
import { MOCK_USER } from "../providers/mock/mock.user";
import { MockUserProvider, RewardEvent } from "../providers/mock/mock.user.provider";

type P = "MOCK" | "WOO" | "SHOPIFY";
const getProvider = (): P => (process.env.NEXT_PUBLIC_API_SOURCE ?? "MOCK") as P;

export class UserService {

  static async getUserById(userId: string): Promise<AppUser | null> {
    switch (getProvider()) {
      case "WOO": {
        const { WooAuthProvider } = await import("../providers/woocommerce/woo.auth.provider");
        try { return await WooAuthProvider.getUserById(userId); }
        catch { return null; }
      }
      default:
        return MOCK_USER;
    }
  }

  static async getAddressById(addressId: string): Promise<Address | null> {
    switch (getProvider()) {
      case "WOO": {
        const user = await this.getUserById("current");
        return user?.addresses?.find((a) => a.id === addressId) ?? null;
      }
      default:
        return MOCK_USER.addresses?.find((a) => a.id === addressId) ?? null;
    }
  }

  static async updateProfile(
    userId: string,
    updates: { firstName?: string; lastName?: string; phone?: string; displayName?: string },
    token: string,
  ): Promise<AppUser> {
    switch (getProvider()) {
      case "WOO": {
        const { WooUserProvider } = await import("../providers/woocommerce/woo.user.provider");
        return WooUserProvider.updateProfile(userId, updates, token);
      }
      default:
        return MockUserProvider.updateProfile(userId, updates);
    }
  }

  static async addAddress(
    userId: string,
    address: Omit<Address, "id">,
  ): Promise<Address> {
    switch (getProvider()) {
      case "WOO": {
        const { WooUserProvider } = await import("../providers/woocommerce/woo.user.provider");
        return WooUserProvider.addAddress(userId, address);
      }
      default:
        return MockUserProvider.addAddress(userId, address);
    }
  }

  static async updateAddress(
    userId: string,
    addressId: string,
    updates: Partial<Address>,
  ): Promise<Address> {
    switch (getProvider()) {
      case "WOO": {
        const { WooUserProvider } = await import("../providers/woocommerce/woo.user.provider");
        return WooUserProvider.updateAddress(userId, addressId, updates);
      }
      default:
        return MockUserProvider.updateAddress(userId, addressId, updates);
    }
  }

  static async deleteAddress(userId: string, addressId: string): Promise<void> {
    switch (getProvider()) {
      case "WOO": {
        const { WooUserProvider } = await import("../providers/woocommerce/woo.user.provider");
        return WooUserProvider.deleteAddress(userId, addressId);
      }
      default:
        return MockUserProvider.deleteAddress(userId, addressId);
    }
  }

  static async getRewards(
    userId: string,
  ): Promise<{ points: number; history: RewardEvent[] }> {
    switch (getProvider()) {
      case "WOO": {
        // Plug in your loyalty plugin provider here when ready
        // const { WooRewardsProvider } = await import("../providers/woocommerce/woo.rewards.provider");
        // return WooRewardsProvider.getRewards(userId);
        return MockUserProvider.getRewards(userId);
      }
      default:
        return MockUserProvider.getRewards(userId);
    }
  }
}