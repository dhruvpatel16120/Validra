/**
 * POST /api/auth/reset-password
 * Reset user password using a valid reset token.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token) {
      return NextResponse.json(
        { message: "Reset token is required." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Find user with this reset token
    const user = await prisma.user.findUnique({
      where: { resetToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { message: "This reset link is invalid or has already been used.", detail: "INVALID_OR_EXPIRED_TOKEN" },
        { status: 400 }
      );
    }

    // Check token expiry
    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      return NextResponse.json(
        { message: "This reset link has expired. Please request a new one.", detail: "INVALID_OR_EXPIRED_TOKEN" },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Send confirmation email
    try {
      const { sendPasswordChangedConfirmation } = await import("@/lib/email");
      await sendPasswordChangedConfirmation(user.email, user.fullName);
    } catch (emailErr) {
      console.error("Failed to send password changed confirmation email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
