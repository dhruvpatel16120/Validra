/**
 * POST /api/auth/forgot-password
 * Initiate password reset by sending a reset link email.
 * Always returns success to prevent email enumeration attacks.
 */

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email?.trim()) {
      return NextResponse.json(
        { message: "Email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success regardless of whether user exists (security)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, password reset instructions have been sent.",
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send reset email
    try {
      await sendPasswordResetEmail(normalizedEmail, resetToken, user.fullName, request);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, password reset instructions have been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
