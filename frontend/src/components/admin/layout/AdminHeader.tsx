"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Search, ChevronRight, Clock } from "lucide-react";
import { Input } from "@/components/shared";

export function AdminHeader() {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = React.useState<string>("");

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toISOString().replace("T", " ").substring(0, 19) + " UTC"
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute breadcrumbs from path
  const pathParts = pathname.split("/").filter(Boolean);
  const breadcrumb = pathParts.length > 1 ? pathParts[1] : "Dashboard";
  const formattedBreadcrumb =
    breadcrumb.charAt(0).toUpperCase() + breadcrumb.slice(1).replace(/-/g, " ");

  return (
    <header className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Page Routing Only (Portal > Current Page) */}
      <div className="flex items-center gap-2 text-xs font-medium select-none">
        <span className="text-slate-400 font-mono uppercase tracking-wider text-[11px]">
          Portal
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-slate-900 font-bold tracking-tight text-sm">
          {formattedBreadcrumb}
        </span>
      </div>

      {/* Right: Search and Time Only */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative w-56 sm:w-64 lg:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search records, rules, IDs..."
            className="h-8.5 pl-9 pr-3 text-xs bg-slate-50/80 border-slate-200 focus:bg-white focus:border-slate-400 shadow-2xs"
          />
        </div>

        {/* Live Clock */}
        {currentTime && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime}</span>
          </div>
        )}
      </div>
    </header>
  );
}

