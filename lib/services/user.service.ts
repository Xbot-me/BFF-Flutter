import { AppUser, Address } from "../models/user";
import { MOCK_USER } from "../providers/mock/mock.user";
import { MockUserProvider, RewardEvent } from "../providers/mock/mock.user.provider";

type P = "MOCK" | "SHOPIFY";
const getProvider = (): P => (process.env.NEXT_PUBLIC_API_SOURCE ?? "MOCK") as P;

export class UserService {

  static async getUserById(userId: string): Promise<AppUser | null> {
    switch (getProvider()) {
      default:
        return MOCK_USER;
    }
  }

  static async getAddressById(addressId: string): Promise<Address | null> {
    switch (getProvider()) {
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
      default:
        return MockUserProvider.updateProfile(userId, updates);
    }
  }

  static async addAddress(
    userId: string,
    address: Omit<Address, "id">,
  ): Promise<Address> {
    switch (getProvider()) {
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
      default:
        return MockUserProvider.updateAddress(userId, addressId, updates);
    }
  }

  static async deleteAddress(userId: string, addressId: string): Promise<void> {
    switch (getProvider()) {
      default:
        return MockUserProvider.deleteAddress(userId, addressId);
    }
  }

  static async getRewards(
    userId: string,
  ): Promise<{ points: number; history: RewardEvent[] }> {
    switch (getProvider()) {
      default:
        return MockUserProvider.getRewards(userId);
    }
  }

  static async deleteUser(userId: string): Promise<void> {
    switch (getProvider()) {
      default:
        return MockUserProvider.deleteUser(userId);
    }
  }
}