"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Camera, ArrowRight, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/inspector/common";
import {
  ImageUploader,
  CameraCapture,
  UploadProgress,
  MAX_SCAN_IMAGES,
} from "@/components/inspector/scan";
import { Button } from "@/components/shared/ui/button";
import { scanService } from "@/services/scan-service";
import { getUserFriendlyErrorMessage } from "@/services/api";
import { ScanUploadState } from "@/types/scan";
import { cn } from "@/lib/utils";

type InputMode = "upload" | "camera";

const MAX_PHOTOS = MAX_SCAN_IMAGES;

export default function NewScanPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<InputMode>("upload");
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [uploadState, setUploadState] = React.useState<ScanUploadState>("idle");
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const redirectTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  const isUploading = uploadState === "uploading";
  const totalSize = photos.reduce((sum, file) => sum + file.size, 0);
  const isAtLimit = photos.length >= MAX_PHOTOS;

  const handleFilesSelected = (files: File[]) => {
    setPhotos((prev) => [...prev, ...files].slice(0, MAX_PHOTOS));
    if (uploadState === "error") {
      setUploadState("idle");
      setUploadError(null);
    }
  };

  const handleRemoveFile = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    if (uploadState === "error") {
      setUploadState("idle");
      setUploadError(null);
    }
  };

  const handleCameraCapture = (file: File) => {
    handleFilesSelected([file]);
    setMode("upload"); // Switch to preview mode once captured
  };

  const handleStartScan = async () => {
    if (!photos.length || isUploading) return;

    setUploadState("uploading");
    setUploadError(null);

    try {
      const response = await scanService.uploadScan(photos);
      setUploadState("complete");
      // Short delay for the user to register completion before the transition.
      redirectTimer.current = setTimeout(() => {
        router.push(`/scan/${response.scan_id}/processing`);
      }, 500);
    } catch (err: unknown) {
      setUploadState("error");
      setUploadError(getUserFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      <PageHeader
        title="New Inspection Scan"
        description="Upload or capture product package labels for automated OCR extraction and Legal Metrology rule audit."
      />

      {/* Instructions Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-900 block mb-0.5">
              Legal Metrology (Packaged Commodities) Guidelines
            </span>
            Capture 1 to 4 well-lit, non-blurry images. Ensure mandatory declarations (MRP, Net Quantity, Mfg/Pack Date, Batch No, and Manufacturer Address) are squarely visible.
          </div>
        </div>

        {/* Input Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-stretch sm:self-auto justify-center">
          <button
            type="button"
            onClick={() => setMode("upload")}
            disabled={isUploading}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              mode === "upload"
                ? "bg-white text-emerald-800 font-semibold shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("camera")}
            disabled={isUploading || isAtLimit}
            title={isAtLimit ? `Maximum ${MAX_PHOTOS} photos per scan` : undefined}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              mode === "camera"
                ? "bg-white text-emerald-800 font-semibold shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900",
              isAtLimit && "opacity-50 cursor-not-allowed"
            )}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>
        </div>
      </div>

      {/* Main Upload / Camera View */}
      {mode === "camera" ? (
        <CameraCapture
          onCapture={handleCameraCapture}
          onCancel={() => setMode("upload")}
          photoNumber={Math.min(photos.length + 1, MAX_PHOTOS)}
          maxPhotos={MAX_PHOTOS}
        />
      ) : (
        <div className="space-y-4">
          <ImageUploader
            selectedFiles={photos}
            onFilesSelected={handleFilesSelected}
            onRemoveFile={handleRemoveFile}
            maxFiles={MAX_PHOTOS}
            disabled={isUploading}
          />

          {/* Upload Progress Status */}
          <UploadProgress
            state={uploadState}
            fileName={photos[0]?.name}
            fileSize={totalSize}
            fileCount={photos.length}
            error={uploadError}
            onRetry={handleStartScan}
          />

          {/* Action Trigger */}
          {photos.length > 0 && uploadState !== "complete" && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className="text-xs text-slate-500">
                {photos.length} of {MAX_PHOTOS} photos selected &bull; OCR evaluation takes 5-20 seconds.
              </p>
              <Button
                type="button"
                variant="default"
                size="md"
                onClick={handleStartScan}
                disabled={isUploading}
                className="gap-2 font-semibold shrink-0"
              >
                <span>
                  {isUploading ? "Running Compliance Scan..." : "Initiate Compliance Scan"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
