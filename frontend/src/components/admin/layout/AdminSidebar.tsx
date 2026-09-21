"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Scale,
  FileCheck2,
  Settings,
  ShieldAlert,
  ExternalLink,
  LogOut,
  Radio,
  FileText,
} from "lucide-react";
import { Logo } from "@/components/shared";
import { cn } from "@/lib/utils";

interface NavGroup {
  section: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeVariant?: "default" | "warning" | "success" | "live";
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    section: "Supervisory Oversight",
    items: [
      {
        label: "Supervisory Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Enforcement Officers",
        href: "/admin/users",
        icon: Users,
      },
      {
        label: "Field Inspections",
        href: "/admin/inspections",
        icon: FileCheck2,
        badge: "19 Review",
        badgeVariant: "warning",
      },
    ],
  },
  {
    section: "Statutory Framework",
    items: [
      {
        label: "Metrology Rules",
        href: "/admin/rules",
        icon: Scale,
        badge: "PCR 2011",
        badgeVariant: "default",
      },
    ],
  },
  {
    section: "Governance & Security",
    items: [
      {
        label: "Security Audit Trail",
        href: "/admin/audit-logs",
        icon: ShieldAlert,
        badge: "Live",
        badgeVariant: "live",
      },
      {
        label: "System Configuration",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user as { fullName?: string; name?: string; email?: string } | undefined;
  const userName = user?.fullName || user?.name || "Supervisory Officer";
  const userEmail = user?.email || "admin@validra.gov.in";
  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .map((part: string) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "AD";

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 shadow-xs select-none">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Top Header Logo & Statutory Tag */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Admin</span>
          </div>
        </div>

        {/* Official Authority Badge */}
        <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>LEGAL METROLOGY DIV.</span>
          <span className="font-semibold text-slate-700">OVERSIGHT</span>
        </div>

        {/* Grouped Navigation List */}
        <div className="px-3 py-3 space-y-4 overflow-y-auto flex-1">
          {NAV_GROUPS.map((group) => (
            <div key={group.section} className="space-y-1">
              <div className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                {group.section}
              </div>

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                      isActive
                        ? "bg-emerald-800 text-white font-semibold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "w-4 h-4 transition-colors",
                          isActive
                            ? "text-emerald-200"
                            : "text-slate-400 group-hover:text-slate-700"
                        )}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          "text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold transition-colors flex items-center gap-1",
                          isActive
                            ? "bg-emerald-900/80 text-emerald-100 border border-emerald-700"
                            : item.badgeVariant === "warning"
                            ? "bg-amber-100 text-amber-900 border border-amber-200"
                            : item.badgeVariant === "live"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-slate-200/70"
                        )}
                      >
                        {item.badgeVariant === "live" && (
                          <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
                        )}
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Profile & Actions */}
      <div className="p-3 border-t border-slate-200 space-y-2 bg-slate-50/60 flex-shrink-0">
        {/* Switch to Inspector Field Workspace */}
        <Link
          href="/dashboard"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all group"
          title="Switch to field officer inspection interface"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 transition-colors" />
            <span className="font-medium">Field Inspector App</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">
            Field
          </span>
        </Link>

        {/* Authenticated Officer Badge */}
        <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-emerald-800 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 font-mono shadow-xs">
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
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors ml-1 flex-shrink-0"
            title="Terminate Administrative Session"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
