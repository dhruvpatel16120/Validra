import * as React from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { cn } from "@/lib/utils";

export const MAX_SCAN_IMAGES = 4;

export interface ImageUploaderProps {
  /** 0-4 label photos selected for the next scan. */
  selectedFiles: File[];
  /** Called with newly picked files; the parent appends them up to `maxFiles`. */
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB matching backend constraint
const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/bmp",
];
const ACCEPTED_EXTENSIONS = ".jpg, .jpeg, .png, .webp, .bmp";

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Accessible ImageUploader with drag-and-drop, format/size validation, and previews.
 * Accepts 1-4 label photos: the backend rejects an empty or 5+ image upload.
 */
export function ImageUploader({
  selectedFiles,
  onFilesSelected,
  onRemoveFile,
  maxFiles = MAX_SCAN_IMAGES,
  disabled = false,
  className,
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Compute preview URLs safely without setting state in effect
  const previewUrls = React.useMemo(
    () => selectedFiles.map((file) => URL.createObjectURL(file)),
    [selectedFiles]
  );

  React.useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const remainingSlots = Math.max(maxFiles - selectedFiles.length, 0);

  const validateAndProcessFiles = (fileList: File[]) => {
    if (!fileList.length) return;
    setValidationError(null);

    if (remainingSlots === 0) {
      setValidationError(`You can upload at most ${maxFiles} photos per scan.`);
      return;
    }

    const accepted: File[] = [];
    const rejected: string[] = [];

    fileList.forEach((file) => {
      if (!ACCEPTED_MIME_TYPES.includes(file.type.toLowerCase())) {
        rejected.push(`${file.name}: unsupported format (use JPEG, PNG, WEBP, or BMP).`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        rejected.push(
          `${file.name}: exceeds the 5MB limit (${formatBytes(file.size)}).`
        );
        return;
      }
      accepted.push(file);
    });

    const overflowed = accepted.length > remainingSlots;
    const toAdd = accepted.slice(0, remainingSlots);

    if (rejected.length) {
      setValidationError(rejected.join(" "));
    } else if (overflowed) {
      setValidationError(
        `You can upload at most ${maxFiles} photos per scan. Only the first ${toAdd.length} were added.`
      );
    }

    if (toAdd.length) {
      onFilesSelected(toAdd);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    validateAndProcessFiles(files);
    // Allow re-selecting the same file after a removal.
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    validateAndProcessFiles(Array.from(e.dataTransfer.files ?? []));
  };

  const handleRemove = (index: number) => {
    onRemoveFile(index);
    setValidationError(null);
  };

  const handleTriggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        multiple
        onChange={handleFileChange}
        className="sr-only"
        disabled={disabled}
        aria-label="Upload commodity package images"
      />

      {/* Validation Error Alert */}
      {validationError && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Preview View when at least one photo is selected */}
      {selectedFiles.length > 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
              <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{selectedFiles.length === 1 ? "Image Ready for Inspection" : "Images Ready for Inspection"}</span>
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 text-[11px] font-mono text-slate-500 border border-slate-200 shadow-2xs">
              <span>
                Photo {selectedFiles.length} of {maxFiles}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${file.lastModified}-${index}`}
                className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 space-y-3"
              >
                <div className="w-full h-40 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrls[index]}
                    alt={`Selected package preview ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="min-w-0 space-y-1">
                  <h4 className="text-sm font-semibold text-slate-900 truncate">
                    {file.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    Size: {formatBytes(file.size)} • Type: {file.type || "image"}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  className="gap-1.5 text-xs h-8 w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove photo</span>
                </Button>
              </div>
            ))}

            {remainingSlots > 0 && (
              <button
                type="button"
                onClick={handleTriggerInput}
                disabled={disabled}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3 min-h-[13rem] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 text-slate-500 transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30",
                  isDragOver
                    ? "border-emerald-600 bg-emerald-50/50 text-emerald-700"
                    : "hover:border-emerald-500 hover:bg-emerald-50/20 hover:text-emerald-700",
                  disabled && "opacity-50 pointer-events-none cursor-not-allowed"
                )}
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                <span className="text-xs font-semibold">
                  Add photo ({remainingSlots} slot{remainingSlots === 1 ? "" : "s"} left)
                </span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Empty Drag & Drop Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleTriggerInput}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleTriggerInput();
            }
          }}
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-label="Upload package label images. Drag and drop files or click to select up to 4 photos."
          className={cn(
            "relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30",
            isDragOver
              ? "border-emerald-600 bg-emerald-50/50"
              : "border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/20",
            disabled && "opacity-50 pointer-events-none cursor-not-allowed"
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-4">
            <UploadCloud className="w-6 h-6" aria-hidden="true" />
          </div>

          <h3 className="text-sm sm:text-base font-semibold text-slate-900">
            Click to upload or drag and drop package photos
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
            Ensure MRP, Net Quantity, Mfg Date, and Manufacturer declarations are clearly visible.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[11px] font-mono text-slate-500 border border-slate-200 shadow-2xs">
            <span>JPG, PNG, WEBP, BMP</span>
            <span>•</span>
            <span>Max 5MB</span>
            <span>•</span>
            <span>1-4 photos</span>
          </div>
        </div>
      )}
    </div>
  );
}
