// ---------------------------------------------------------------------------
// Environment variable validation
// Call validateEnv() at the top of your Next.js instrumentation file:
//   src/instrumentation.ts → export async function register() { validateEnv(); }
//
// This crashes the process at startup with a clear message rather than
// failing silently on the first real request.
// ---------------------------------------------------------------------------

interface EnvRule {
  key:      string;
  required: string[];  // which API_SOURCE modes require this var
}

const ENV_RULES: EnvRule[] = [
  { key: "NEXT_PUBLIC_API_SOURCE", required: ["always"] },
];

export function validateEnv(): void {
  const source = process.env.NEXT_PUBLIC_API_SOURCE ?? "MOCK";
  const errors: string[] = [];

  for (const rule of ENV_RULES) {
    const isRequired =
      rule.required.includes("always") ||
      rule.required.includes(source);

    if (isRequired && !process.env[rule.key]) {
      errors.push(`Missing required environment variable: ${rule.key} (required when API_SOURCE=${source})`);
    }
  }

  if (errors.length > 0) {
    console.error("\n[BFF] Environment validation failed:\n" + errors.map((e) => `  ✗ ${e}`).join("\n") + "\n");
    process.exit(1);
  }

  console.log(`[BFF] Environment OK — source=${source}`);
}

// ---------------------------------------------------------------------------
// Safe env getter — throws with a clear message if a var is missing
// at call time rather than returning undefined silently
// ---------------------------------------------------------------------------

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Required environment variable "${key}" is not set`);
  return value;
}