import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: "sm" | "md" | "lg";
  theme?: "light" | "dark" | "auto";
}

export function Logo({
  className,
  showSubtitle = true,
  size = "md",
  theme = "light",
}: LogoProps) {
  const imageDimensions = {
    sm: { width: 32, height: 32 },
    md: { width: 42, height: 42 },
    lg: { width: 50, height: 50 },
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const isDark = theme === "dark";

  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 group select-none", className)}>
      {/* Emblem from public folder */}
      <div className="relative flex items-center justify-center shrink-0 drop-shadow-xs">
        <Image
          src="/logo-192.png"
          alt="Validra Logo"
          width={imageDimensions[size].width}
          height={imageDimensions[size].height}
          className="object-contain transition-transform group-hover:scale-105"
          priority
        />
      </div>

      {/* Brand Text */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center">
          <span
            className={cn(
              "font-extrabold tracking-tight",
              isDark ? "text-white" : "text-slate-900",
              textSizes[size]
            )}
          >
            VALID<span className="text-green-600">RA</span>
          </span>
        </div>
        {showSubtitle && (
          <span
            className={cn(
              "text-[10px] font-semibold tracking-wider uppercase",
              isDark ? "text-slate-400" : "text-slate-500"
            )}
          >
            Legal Metrology Portal
          </span>
        )}
      </div>
    </Link>
  );
}
