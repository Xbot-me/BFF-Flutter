import { AppUser, Address } from "../../models/user";
import { MOCK_USER } from "./mock.user";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ---------------------------------------------------------------------------
// RewardEvent — module level
// ---------------------------------------------------------------------------

export interface RewardEvent {
  id:          string;
  description: string;
  points:      number;   // positive = earned, negative = spent
  createdAt:   string;
}

// ---------------------------------------------------------------------------
// In-memory user store seeded with MOCK_USER
// ---------------------------------------------------------------------------

const userStore = new Map<string, AppUser>([
  [MOCK_USER.id, { ...MOCK_USER }],
]);

function getUser(userId: string): AppUser {
  // Fall back to MOCK_USER if userId not found — covers cases where
  // userId is "current" or a token-derived ID not yet in the store
  return userStore.get(userId) ?? userStore.get(MOCK_USER.id)!;
}

// ---------------------------------------------------------------------------
// MockUserProvider
// ---------------------------------------------------------------------------

export class MockUserProvider {

  static async updateProfile(
    userId: string,
    updates: {
      firstName?:   string;
      lastName?:    string;
      phone?:       string;
      displayName?: string;
    },
  ): Promise<AppUser> {
    await delay(400);

    const user    = getUser(userId);
    const updated: AppUser = {
      ...user,
      firstName:   updates.firstName   ?? user.firstName,
      lastName:    updates.lastName    ?? user.lastName,
      phone:       updates.phone       ?? user.phone,
      displayName: updates.displayName ?? user.displayName,
      updatedAt:   new Date().toISOString(),
    };

    userStore.set(user.id, updated);
    return updated;
  }

  static async addAddress(
    userId: string,
    address: Omit<Address, "id">,
  ): Promise<Address> {
    await delay(400);

    const user       = getUser(userId);
    const newAddress: Address = { ...address, id: `addr_${Date.now()}` };
    const updated    = {
      ...user,
      addresses: [...(user.addresses ?? []), newAddress],
    };

    userStore.set(user.id, updated);
    return newAddress;
  }

  static async updateAddress(
    userId: string,
    addressId: string,
    updates: Partial<Address>,
  ): Promise<Address> {
    await delay(400);

    const user      = getUser(userId);
    const addresses = [...(user.addresses ?? [])];
    const idx       = addresses.findIndex((a) => a.id === addressId);

    if (idx < 0) throw new Error(`Address ${addressId} not found`);

    const updated = { ...addresses[idx], ...updates, id: addressId };
    addresses[idx] = updated;
    userStore.set(user.id, { ...user, addresses });

    return updated;
  }

  static async deleteAddress(userId: string, addressId: string): Promise<void> {
    await delay(300);

    const user     = getUser(userId);
    const filtered = (user.addresses ?? []).filter((a) => a.id !== addressId);
    userStore.set(user.id, { ...user, addresses: filtered });
  }

  static async getRewards(
    userId: string,
  ): Promise<{ points: number; history: RewardEvent[] }> {
    await delay(300);

    const user = getUser(userId);
    return {
      points: user.rewardPoints ?? 0,
      history: [
        { id: "r1", description: "Purchase #1042",      points:  65,  createdAt: "2024-05-01T10:30:00Z" },
        { id: "r2", description: "Purchase #1038",      points:  87,  createdAt: "2024-04-25T08:15:00Z" },
        { id: "r3", description: "Welcome bonus",       points: 100,  createdAt: "2024-01-15T10:00:00Z" },
        { id: "r4", description: "Redeemed for coupon", points: -200, createdAt: "2024-03-01T12:00:00Z" },
      ],
    };
  }

  static async deleteUser(userId: string): Promise<void> {
    await delay(500);
    userStore.delete(userId);
  }
}