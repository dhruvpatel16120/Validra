"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthLoadingState } from "@/components/auth/AuthLoadingState";
import { AdminShell } from "@/components/admin";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/admin-login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      // Only ADMIN role can access admin portal
      if (session.user.role !== "ADMIN") {
        router.replace("/dashboard");
        return;
      }
    }
  }, [status, session, router]);

  // Loading state
  if (status === "loading") {
    return <AuthLoadingState message="Verifying admin authorization..." />;
  }

  // Prevent flash while redirecting
  if (status === "unauthenticated" || !session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return <AdminShell>{children}</AdminShell>;
}
