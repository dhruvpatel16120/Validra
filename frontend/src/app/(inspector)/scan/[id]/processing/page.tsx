"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { PageHeader, ErrorState } from "@/components/inspector/common";
import { ProcessingStatus, type ProcessingStage } from "@/components/inspector/scan";
import { Button } from "@/components/shared/ui/button";
import { scanService } from "@/services/scan-service";
import { getUserFriendlyErrorMessage } from "@/services/api";
import type { ScanStatus } from "@/types/scan";

interface ProcessingPageProps {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/scans already returns the finished verdict synchronously, so this page
 * fetches the stored scan exactly once and then opens the review. There is no
 * background job to poll.
 */
export default function ScanProcessingPage({ params }: ProcessingPageProps) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const scanId = resolvedParams.id;

  const [status, setStatus] = React.useState<ScanStatus>("pending");
  const [stage, setStage] = React.useState<ProcessingStage>("received");
  const [error, setError] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    let isCancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;

    scanService
      .getScanById(scanId)
      .then((detail) => {
        if (isCancelled) return;

        setStatus(detail.overall_status as ScanStatus);
        setStage("ready");

        // Brief pause so the completed pipeline is visible before the handoff.
        redirectTimer = setTimeout(() => {
          if (!isCancelled) {
            router.replace(`/scan/${scanId}/review`);
          }
        }, 600);
      })
      .catch((err: unknown) => {
        if (isCancelled) return;
        setError(getUserFriendlyErrorMessage(err));
      });

    return () => {
      isCancelled = true;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [scanId, router, reloadKey]);

  const handleRetry = () => {
    setError(null);
    setStatus("pending");
    setStage("received");
    setReloadKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto">
      <PageHeader
        title="Processing Package Scan"
        description={`Scan Reference: ${scanId}`}
      />

      {error ? (
        <ErrorState
          title="Analysis Could Not Complete"
          description={error}
          action={
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => router.push("/scan/new")}
                className="gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Upload New Photo</span>
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleRetry}
                className="gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Analysis</span>
              </Button>
            </div>
          }
        />
      ) : (
        <ProcessingStatus
          status={status}
          currentStage={stage}
          error={error}
        />
      )}
    </div>
  );
}
