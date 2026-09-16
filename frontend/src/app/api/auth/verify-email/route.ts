/**
 * GET /api/auth/verify-email?token=...
 * Verify inspector email address using token from verification email.
 * Sets isVerified=true and clears the token.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      // Redirect to login with error
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      return NextResponse.redirect(
        `${baseUrl}/login?error=missing_token&message=${encodeURIComponent("Verification link is invalid.")}`
      );
    }

    // Find user with this token
    const user = await prisma.user.findUnique({
      where: { verifyToken: token },
    });

    if (!user) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      return NextResponse.redirect(
        `${baseUrl}/login?error=invalid_token&message=${encodeURIComponent("Verification link is invalid or has already been used.")}`
      );
    }

    // Check token expiry
    if (user.verifyTokenExpiry && user.verifyTokenExpiry < new Date()) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      return NextResponse.redirect(
        `${baseUrl}/verify-email?email=${encodeURIComponent(user.email)}&error=expired&message=${encodeURIComponent("Verification link has expired. Please request a new one.")}`
      );
    }

    // Mark as verified and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verifyToken: null,
        verifyTokenExpiry: null,
      },
    });

    // Redirect to login with success message
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/login?verified=true&message=${encodeURIComponent("Email verified successfully! You can now sign in.")}`
    );
  } catch (error) {
    console.error("Email verification error:", error);
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/login?error=server_error&message=${encodeURIComponent("An error occurred during verification. Please try again.")}`
    );
  }
}
