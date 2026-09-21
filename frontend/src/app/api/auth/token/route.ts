import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { auth } from "@/lib/auth";

/**
 * GET /api/auth/token
 * Returns an HS256 JWT bearer token for the current NextAuth session.
 * Used by the frontend client to authenticate requests with the Python FastAPI backend.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "No active session found." },
        { status: 401 }
      );
    }

    const secretKey =
      process.env.AUTH_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      "validra-default-jwt-secret-key-change-in-production";

    const secret = new TextEncoder().encode(secretKey);

    const user = session.user;
    const role = (user.role || "citizen").toLowerCase();

    const token = await new SignJWT({
      sub: user.id,
      id: user.id,
      email: user.email,
      role,
      name: user.fullName || user.email.split("@")[0],
      fullName: user.fullName,
      isActive: user.isActive,
      isVerified: user.isVerified,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(secret);

    return NextResponse.json({
      accessToken: token,
      tokenType: "Bearer",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        isActive: user.isActive,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Error generating session token:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Could not generate session token." },
      { status: 500 }
    );
  }
}
