
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { recordAuditLog } from "@/lib/audit";

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
      await recordAuditLog({
        userName: "Unregistered / Unknown",
        userEmail: normalizedEmail,
        userRole: "inspector",
        action: "AUTH_FAILURE",
        severity: "HIGH",
        status: "FAILURE",
        description: `API login failed: Account ${normalizedEmail} not found.`,
      });
      return NextResponse.json(
        { message: "Invalid email address or password.", detail: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await recordAuditLog({
        userName: user.fullName,
        userEmail: user.email,
        userRole: user.role.toLowerCase(),
        action: "AUTH_FAILURE",
        severity: "HIGH",
        status: "FAILURE",
        description: `API login failed: Incorrect password attempt for ${user.email}.`,
      });
      return NextResponse.json(
        { message: "Invalid email address or password.", detail: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    if (!user.isVerified) {
      await recordAuditLog({
        userName: user.fullName,
        userEmail: user.email,
        userRole: user.role.toLowerCase(),
        action: "AUTH_FAILURE",
        severity: "MEDIUM",
        status: "FAILURE",
        description: `API login blocked for ${user.email}: Email not verified.`,
      });
      return NextResponse.json(
        { message: "Email address has not been verified.", detail: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    if (!user.isActive) {
      await recordAuditLog({
        userName: user.fullName,
        userEmail: user.email,
        userRole: user.role.toLowerCase(),
        action: "AUTH_FAILURE",
        severity: "MEDIUM",
        status: "FAILURE",
        description: `API login blocked for ${user.email}: Account pending admin approval.`,
      });
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

    await recordAuditLog({
      userName: user.fullName,
      userEmail: user.email,
      userRole,
      action: userRole === "admin" ? "ADMIN_LOGIN" : "USER_LOGIN",
      severity: "INFO",
      status: "SUCCESS",
      description: `${userRole === "admin" ? "Administrator" : "Field Inspector"} ${user.fullName} (${user.email}) logged in via API.`,
    });

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
