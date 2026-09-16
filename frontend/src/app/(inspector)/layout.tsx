"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AuthLoadingState } from "@/components/auth/AuthLoadingState";
import { InspectorShell } from "@/components/inspector/layout/InspectorShell";

export default function InspectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const isBypass =
    process.env.NEXT_PUBLIC_BYPASS_INSPECTION_AUTH === "true" ||
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true" ||
    process.env.NEXT_PUBLIC_INSPECTOR_BYPASS === "true";

  React.useEffect(() => {
    if (!isBypass && !isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router, isBypass]);

  // While session is being determined, render minimal, accessible loading state
  if (isLoading && !isBypass) {
    return <AuthLoadingState message="Verifying inspector authorization..." />;
  }

  // Prevent flash of protected content while redirecting unauthenticated users
  if (!isAuthenticated && !isBypass) {
    return null;
  }

  return <InspectorShell>{children}</InspectorShell>;
}
