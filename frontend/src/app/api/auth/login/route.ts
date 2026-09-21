
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

/**
 * POST /api/auth/login
 * Direct credential authentication endpoint for Validra frontend API client.
 * Validates against PostgreSQL, checks approval, and returns a signed HS256 JWT.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email address or password.", detail: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid email address or password.", detail: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { message: "Email address has not been verified.", detail: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { message: "Account is pending admin approval.", detail: "ACCOUNT_NOT_APPROVED" },
        { status: 403 }
      );
    }

    const secretKey =
      process.env.AUTH_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      "validra-default-jwt-secret-key-change-in-production";

    const secret = new TextEncoder().encode(secretKey);
    const role = (user.role || "citizen").toLowerCase();

    const accessToken = await new SignJWT({
      sub: user.id,
      id: user.id,
      email: user.email,
      role,
      name: user.fullName,
      fullName: user.fullName,
      isActive: user.isActive,
      isVerified: user.isVerified,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(secret);

    const userRole: "inspector" | "admin" =
      user.role === "ADMIN" || role === "admin" ? "admin" : "inspector";

    const clientUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: userRole,
      isActive: user.isActive,
      isVerified: user.isVerified,
      badgeNumber: user.badgeNumber ?? undefined,
      jurisdiction: user.jurisdiction ?? undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json({
      accessToken,
      tokenType: "Bearer",
      user: clientUser,
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred during authentication.", detail: String(error) },
      { status: 500 }
    );
  }
}
