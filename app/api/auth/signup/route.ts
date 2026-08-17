import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { AuthService } from "@/lib/services/auth.service";
import { UserSchema } from "@/lib/validations/user.schema";

// ---------------------------------------------------------------------------
// Request validation
// ---------------------------------------------------------------------------

const SignupSchema = z.object({
  email:     z.string().email("Valid email is required"),
  password:  z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1).optional(),
  lastName:  z.string().min(1).optional(),
  phone:     z.string().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/auth/signup
//
// Body:
//   { "email": "fan@example.com", "password": "password123",
//     "firstName": "Rafi", "lastName": "Ahmed", "phone": "+8801700000000" }
//
// Success (201):
//   { "success": true, "user": AppUser, "token": "..." }
//   Flutter stores token, goes straight to home screen — no second login needed.
//
// Error (409) — email already exists:
//   { "success": false, "error": "An account with this email already exists" }
//
// Error (422) — validation:
//   { "success": false, "error": "Validation failed", "fields": { ... } }
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  // Validate
  let input;
  try {
    input = SignupSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const fields = err.issues.reduce<Record<string, string>>((acc, e) => {
        acc[e.path.join(".")] = e.message;
        return acc;
      }, {});
      return NextResponse.json(
        { success: false, error: "Validation failed", fields },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }

  try {
    const { user, token } = await AuthService.signup(
      input.email,
      input.password,
      input.firstName,
      input.lastName,
      input.phone,
    );

    const validatedUser = UserSchema.parse(user);

    return NextResponse.json(
      { success: true, user: validatedUser, token },
      { status: 201 }
    );

  } catch (err: any) {
    // Duplicate email — surface cleanly to Flutter
    if (err.message?.includes("already exists")) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 409 }
      );
    }

    console.error("[POST /api/auth/signup]", err.message);
    return NextResponse.json(
      { success: false, error: err.message ?? "Failed to create account" },
      { status: 500 }
    );
  }
}