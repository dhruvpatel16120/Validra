import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Fallback error handler for NextAuth /api/auth/error route.
 * Redirects user back to /login with a descriptive error query parameter instead of a 404.
 */
export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error") || "Configuration";
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", error);

  if (error === "Configuration") {
    loginUrl.searchParams.set(
      "message",
      "Authentication configuration issue. Please verify environment variables in Vercel."
    );
  } else if (error === "AccessDenied") {
    loginUrl.searchParams.set(
      "message",
      "Access was denied. Please check your account permissions."
    );
  } else if (error === "Verification") {
    loginUrl.searchParams.set(
      "message",
      "Email verification link is invalid or expired."
    );
  } else {
    loginUrl.searchParams.set(
      "message",
      "Sign in encountered an issue. Please enter your credentials and try again."
    );
  }

  return NextResponse.redirect(loginUrl);
}
