import * as React from "react";
import { Loader2, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { ScanUploadState } from "@/types/scan";
import { cn } from "@/lib/utils";

export interface UploadProgressProps {
  state: ScanUploadState;
  fileName?: string;
  fileSize?: number;
  /** Number of photos in the upload; drives the "N photos" label. */
  fileCount?: number;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Upload progress indicator showing explicit states: uploading, complete, error.
 * OCR + LLM evaluation takes 5-20 seconds, so the uploading state is explicit.
 */
export function UploadProgress({
  state,
  fileName,
  fileSize,
  fileCount,
  error,
  onRetry,
  className,
}: UploadProgressProps) {
  if (state === "idle") return null;

  const fileLabel =
    fileCount && fileCount > 1
      ? `${fileCount} photos`
      : fileName ?? "Package image";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-2xl border p-4 sm:p-5 transition-all shadow-xs",
        state === "error"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : state === "complete"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-white text-slate-800",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {state === "uploading" ? (
            <Loader2 className="w-5 h-5 text-emerald-600 animate-spin shrink-0" aria-hidden="true" />
          ) : state === "complete" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" aria-hidden="true" />
          )}

          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {state === "uploading"
                ? "Running OCR and Legal Metrology checks on your photos..."
                : state === "complete"
                ? "Analysis complete. Opening the inspection review..."
                : "Scan failed"}
            </p>
            {(fileName || fileCount) && (
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {fileLabel} {fileSize ? `(${formatBytes(fileSize)})` : ""}
              </p>
            )}
            {state === "uploading" && (
              <p className="text-xs text-slate-500 mt-1">
                This usually takes 5-20 seconds. Please keep this page open.
              </p>
            )}
            {state === "error" && error && (
              <p className="text-xs text-rose-600 mt-1">{error}</p>
            )}
          </div>
        </div>

        {state === "error" && onRetry && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRetry}
            className="shrink-0 h-8 px-2.5 text-xs gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </Button>
        )}
      </div>
    </div>
  );
}
