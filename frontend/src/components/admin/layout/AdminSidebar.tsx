"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  Scale,
  ShieldAlert,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";
import { Logo, Button } from "@/components/shared";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Inspections",
    href: "/admin/inspections",
    icon: FileCheck2,
  },
  {
    label: "Rules",
    href: "/admin/rules",
    icon: Scale,
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: ShieldAlert,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const user = session?.user as { fullName?: string; name?: string; email?: string } | undefined;
  const userName = user?.fullName || user?.name || "Admin Officer";
  const userEmail = user?.email || "admin@validra.gov.in";
  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .map((part: string) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "AD";

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut({ callbackUrl: "/login" });
    } catch {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <>
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 shadow-xs select-none">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Top: Logo Only (No tags) */}
          <div className="h-16 px-5 flex items-center border-b border-slate-200 flex-shrink-0">
            <Logo size="sm" />
          </div>

          {/* Clean Flat Page Indexes (No categories) */}
          <div className="px-3 py-4 space-y-1.5 overflow-y-auto flex-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group",
                    isActive
                      ? "bg-slate-900 text-white font-semibold shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive
                        ? "text-emerald-400"
                        : "text-slate-400 group-hover:text-slate-700"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom: Profile, Email & Logout Button Only */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/60 flex-shrink-0">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 font-mono shadow-xs">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate leading-tight">
                  {userName}
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate leading-tight mt-0.5">
                  {userEmail}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowLogoutModal(true)}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors ml-1 flex-shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sign Out Confirmation</h3>
                <p className="text-xs text-slate-500 mt-0.5">End your administrative session?</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You will need to sign in again to access supervisory controls and audit logs.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="h-8 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="h-8 text-xs bg-rose-700 hover:bg-rose-800 text-white font-medium shadow-xs"
              >
                {isLoggingOut ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Signing out...
                  </span>
                ) : (
                  "Confirm Logout"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
