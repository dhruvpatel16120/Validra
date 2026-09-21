"use client";

import * as React from "react";
import { PageHeader, LoadingState, ErrorState, EmptyState } from "@/components/inspector/common";
import {
  StatsGrid,
  RecentInspections,
  ComplianceTrendChart,
  ViolationBreakdown,
} from "@/components/inspector/dashboard";
import { dashboardService } from "@/services/dashboard-service";
import { getUserFriendlyErrorMessage } from "@/services/api";
import { DashboardData } from "@/types/dashboard";

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const handleReload = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await dashboardService.getDashboardData();
      setData(result);
    } catch (err: unknown) {
      setError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    dashboardService
      .getDashboardData()
      .then((result) => {
        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(getUserFriendlyErrorMessage(err));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your inspection activity, compliance trends, and statutory findings."
      />

      {/* State Transitions: Loading -> Error -> Empty -> Success */}
      {isLoading ? (
        <LoadingState message="Loading dashboard metrics and compliance analytics..." />
      ) : error ? (
        <ErrorState
          title="Unable to load dashboard data"
          description={error}
          onRetry={handleReload}
        />
      ) : !data ||
        (data.stats.total_scans === 0 && data.recentScans.length === 0) ? (
        <EmptyState
          title="No inspection records found"
          description="Your dashboard metrics and analytics will appear here as soon as product scans are executed."
        />
      ) : (
        <>
          {/* Key Metric Counters */}
          <StatsGrid statCards={data.statCards} />

          {/* Analytics Grid: Compliance Trend & Violation Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComplianceTrendChart data={data.complianceTrends} />
            <ViolationBreakdown data={data.violationBreakdown} />
          </div>

          {/* Recent Inspections Table */}
          <RecentInspections inspections={data.recentScans} />
        </>
      )}
    </div>
  );
}
