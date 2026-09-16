"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthLoadingState } from "@/components/auth/AuthLoadingState";
import { InspectorShell } from "@/components/inspector/layout/InspectorShell";

export default function InspectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const isBypass =
    process.env.NEXT_PUBLIC_BYPASS_INSPECTION_AUTH === "true" ||
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true" ||
    process.env.NEXT_PUBLIC_INSPECTOR_BYPASS === "true";

  React.useEffect(() => {
    if (isBypass) return;

    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      // If user is not an inspector, redirect appropriately
      if (session.user.role === "ADMIN") {
        router.replace("/admin/dashboard");
        return;
      }

      // Check if account is approved
      if (!session.user.isActive) {
        router.replace("/pending-approval");
        return;
      }
    }
  }, [status, session, router, isBypass]);

  // While session is being determined, render minimal, accessible loading state
  if (status === "loading" && !isBypass) {
    return <AuthLoadingState message="Verifying inspector authorization..." />;
  }

  // Prevent flash of protected content while redirecting unauthenticated users
  if (!isBypass && (status === "unauthenticated" || !session?.user)) {
    return null;
  }

  // If authenticated but not active (inspector not approved), don't render content
  if (!isBypass && session?.user && !session.user.isActive) {
    return null;
  }

  return <InspectorShell>{children}</InspectorShell>;
}
