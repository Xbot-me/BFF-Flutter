import { AppUser } from "../../models/user";
import { MOCK_USER } from "./mock.user";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ---------------------------------------------------------------------------
// In-memory stores — module level, not inside the class
// ---------------------------------------------------------------------------

interface StoredUser { user: AppUser; password: string }

const MOCK_CREDENTIALS = {
  email:    "mustafizur@dev.com",
  password: "password123",
};

const registeredUsers = new Map<string, StoredUser>([
  [MOCK_CREDENTIALS.email, { user: MOCK_USER, password: MOCK_CREDENTIALS.password }],
]);

// Must be module-level — declaring inside a class body is a syntax error
const resetTokens = new Map<string, { email: string; expiresAt: number }>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateMockJwt(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, mock: true, iat: Date.now() })
  ).toString("base64");
  return `mock.${payload}.signature`;
}

function generateUserId(): string {
  return `mock_user_${Date.now()}`;
}

function buildNewUser(
  id: string,
  email: string,
  firstName?: string,
  lastName?: string,
  phone?: string,
): AppUser {
  return {
    id,
    email,
    firstName:    firstName || undefined,
    lastName:     lastName  || undefined,
    displayName:  firstName && lastName ? `${firstName} ${lastName}` : email.split("@")[0],
    phone:        phone     || undefined,
    rewardPoints: 0,
    addresses:    [],
    isGuest:      false,
    isVerified:   false,
    createdAt:    new Date().toISOString(),
    updatedAt:    new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// MockAuthProvider
// ---------------------------------------------------------------------------

export class MockAuthProvider {

  static async signup(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    phone?: string,
  ): Promise<{ user: AppUser; token: string }> {
    await delay(900);

    if (registeredUsers.has(email)) {
      throw new Error("An account with this email already exists");
    }
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    const id   = generateUserId();
    const user = buildNewUser(id, email, firstName, lastName, phone);
    registeredUsers.set(email, { user, password });

    return { user, token: generateMockJwt(id) };
  }

  static async login(
    email: string,
    password: string,
  ): Promise<{ user: AppUser; token: string }> {
    await delay(800);

    const stored = registeredUsers.get(email);
    if (!stored || stored.password !== password) {
      throw new Error("Invalid email or password");
    }

    return { user: stored.user, token: generateMockJwt(stored.user.id) };
  }

  static async getUser(token: string): Promise<AppUser> {
    await delay(300);

    if (!token || !token.startsWith("mock.")) {
      throw new Error("Invalid or expired token");
    }

    const parts   = token.split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    const userId  = payload.sub as string;

    for (const { user } of registeredUsers.values()) {
      if (user.id === userId) return user;
    }

    throw new Error("User not found");
  }

  static async logout(): Promise<void> {
    await delay(200);
    // JWT is stateless — nothing to invalidate in mock mode
  }

  static async forgotPassword(email: string): Promise<void> {
    await delay(600);

    // Silently succeed even if email not found — prevents user enumeration
    if (!registeredUsers.has(email)) return;

    const token     = `mock_reset_${Math.random().toString(36).slice(2, 18)}`;
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    resetTokens.set(token, { email, expiresAt });

    // Flutter dev reads this from the BFF console to test the reset flow
    console.log(`[MockAuth] Password reset token for ${email}: ${token}`);
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    await delay(600);

    const entry = resetTokens.get(token);
    if (!entry)                       throw new Error("Invalid or expired reset token");
    if (Date.now() > entry.expiresAt) throw new Error("Reset token has expired");
    if (newPassword.length < 8)       throw new Error("Password must be at least 8 characters");

    const stored = registeredUsers.get(entry.email);
    if (!stored) throw new Error("User not found");

    registeredUsers.set(entry.email, { ...stored, password: newPassword });
    resetTokens.delete(token);
  }
}