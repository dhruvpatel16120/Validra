/**
 * POST /api/auth/resend-verification
 * Resend email verification link.
 * Generates a new token and sends a new verification email.
 */

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

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

    // Always return success to prevent email enumeration
    if (!user || user.isVerified) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a new verification link has been sent.",
      });
    }

    // Generate new verification token
    const verifyToken = randomBytes(32).toString("hex");
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verifyToken,
        verifyTokenExpiry,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(normalizedEmail, verifyToken, user.fullName, request);
    } catch (emailError) {
      console.error("Failed to resend verification email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a new verification link has been sent.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
