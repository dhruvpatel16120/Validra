import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Validra Next.js Security & Route Protection Middleware.
 * Runs on Edge runtime to strictly gate routes before SSR/client hydration.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isBypass =
    process.env.NEXT_PUBLIC_BYPASS_INSPECTION_AUTH === "true" ||
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true" ||
    process.env.NEXT_PUBLIC_INSPECTOR_BYPASS === "true";

  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "validra-default-jwt-secret-key-change-in-production";

  const token = await getToken({
    req: request,
    secret,
  });

  const isInspectorRoute =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/scan") ||
    pathname.startsWith("/inspections") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/help");

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/admin-login";

  // 1. If inspection bypass is explicitly enabled for development, allow through
  if (isBypass) {
    return NextResponse.next();
  }

  // 2. Protect Admin Portal Routes (/admin/*)
  if (isAdminRoute) {
    if (!token) {
      const loginUrl = new URL("/admin-login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(loginUrl);
    }

    const role = (token.role as string)?.toUpperCase();
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (token.isActive === false) {
      return NextResponse.redirect(new URL("/admin-login?error=account_deactivated", request.url));
    }

    return NextResponse.next();
  }

  // 3. Protect Field Inspector Workspace Routes (/dashboard, /scan, /inspections, etc.)
  if (isInspectorRoute) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(loginUrl);
    }

    const role = (token.role as string)?.toUpperCase();
    // Admin accessing inspector dashboard -> redirect to admin dashboard
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    // Unverified email -> redirect to verification screen
    if (token.isVerified === false) {
      return NextResponse.redirect(new URL("/verify-email", request.url));
    }

    // Account awaiting admin approval -> redirect to pending approval status
    if (token.isActive === false) {
      return NextResponse.redirect(new URL("/pending-approval", request.url));
    }

    return NextResponse.next();
  }

  // 4. Redirect already authenticated users away from login/registration forms
  if (isAuthRoute && token) {
    const role = (token.role as string)?.toUpperCase();
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } else if (token.isActive && token.isVerified) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard",
    "/scan/:path*",
    "/inspections/:path*",
    "/reports/:path*",
    "/profile/:path*",
    "/profile",
    "/help/:path*",
    "/help",
    "/admin/:path*",
    "/admin",
    "/login",
    "/register",
    "/admin-login",
  ],
};
