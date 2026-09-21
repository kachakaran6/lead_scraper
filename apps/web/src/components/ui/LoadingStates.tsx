import React from "react";
import {
  AlertTriangle,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { Button } from "./Button";
import { Card, CardContent, CardHeader } from "./Card";
import { cn } from "../../lib/utils";

// ============================================================================
// 1. BASE SKELETON PRIMITIVE
// ============================================================================

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "pulse" | "shimmer";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "pulse",
  ...props
}) => {
  return (
    <div
      role="status"
      aria-label="Loading content"
      aria-busy="true"
      className={cn(
        "rounded-md bg-bg-surface-hover/80",
        variant === "pulse" ? "animate-pulse" : "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent",
        className
      )}
      {...props}
    />
  );
};

// ============================================================================
// 2. INLINE SPINNER
// ============================================================================

export interface InlineSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export const InlineSpinner: React.FC<InlineSpinnerProps> = ({
  size = "md",
  className,
  label,
}) => {
  const sizeClasses = {
    sm: "w-3.5 h-3.5 border",
    md: "w-5 h-5 border-2",
    lg: "w-7 h-7 border-2",
  };

  return (
    <div className={cn("inline-flex items-center gap-2 text-text-secondary", className)} role="status">
      <div
        className={cn(
          "rounded-full border-accent border-t-transparent animate-spin shrink-0",
          sizeClasses[size]
        )}
      />
      {label && <span className="text-xs font-medium">{label}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// ============================================================================
// 3. STAT CARD SKELETON
// ============================================================================

export const StatCardSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border border-border-subtle bg-bg-surface">
          <CardContent className="p-4 sm:p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-2 w-2 rounded-full" />
            </div>
            <Skeleton className="h-7 w-20 mt-1" />
            <Skeleton className="h-3 w-14 mt-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ============================================================================
// 4. TABLE SKELETON
// ============================================================================

export interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  cols = 6,
  className,
}) => {
  return (
    <div className={cn("w-full bg-bg-surface border border-border-subtle rounded-xl overflow-hidden", className)}>
      <div className="border-b border-border-subtle p-3.5 bg-bg-base/40 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="divide-y divide-border-subtle">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-4 flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            {Array.from({ length: cols - 1 }).map((_, cIdx) => (
              <Skeleton
                key={cIdx}
                className={cn(
                  "h-4 hidden sm:block",
                  cIdx === cols - 2 ? "w-16" : "w-24"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 5. DASHBOARD FULL SKELETON
// ============================================================================

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6" aria-label="Loading dashboard" aria-busy="true">
      {/* Autopilot Banner Skeleton */}
      <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-72" />
          </div>
        </div>
        <Skeleton className="h-8 w-32 rounded-lg shrink-0" />
      </div>

      {/* KPI Cards Grid Skeleton */}
      <StatCardSkeleton count={6} />

      {/* 2-Column Analytics Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Conversion Funnel Skeleton */}
        <Card className="border border-border-subtle bg-bg-surface">
          <CardHeader className="border-b border-border-subtle pb-3.5 mb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-6 w-20 rounded" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Opportunity Radar Matrix Skeleton */}
        <Card className="border border-border-subtle bg-bg-surface">
          <CardHeader className="border-b border-border-subtle pb-3.5 mb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-16 rounded" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="p-2.5 rounded-md border border-border-subtle bg-bg-base flex items-center justify-between"
              >
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3.5 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Ranked Leads Table Skeleton */}
      <TableSkeleton rows={5} cols={6} />
    </div>
  );
};

// ============================================================================
// 6. DISCOVERY FULL SKELETON
// ============================================================================

export const DiscoverySkeleton: React.FC = () => {
  return (
    <div className="space-y-6" aria-label="Loading discovery engine" aria-busy="true">
      {/* Autopilot Status & Controls Banner Skeleton */}
      <div className="p-5 rounded-xl bg-bg-surface border border-border-subtle space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-64" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </div>

        {/* Telemetry Strip Skeleton */}
        <div className="pt-3 border-t border-border-subtle grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>

      {/* Daily Progress & Discovery KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-2.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-10" />
            </div>
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Live Discovery Stream Skeleton */}
      <div className="p-5 rounded-xl bg-bg-surface border border-border-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-3 w-32" />
        </div>

        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-bg-base border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3 w-72" />
              </div>
              <Skeleton className="h-3 w-20 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 7. OPPORTUNITIES SKELETON
// ============================================================================

export const OpportunitiesSkeleton: React.FC = () => {
  return (
    <div className="space-y-6" aria-label="Loading opportunities" aria-busy="true">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border border-border-subtle bg-bg-surface p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="w-8 h-8 rounded-md" />
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Bar Skeleton */}
      <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle flex flex-col md:flex-row gap-3">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Grid of Opportunity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-3">
            <div className="flex justify-between items-start">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-12 w-full rounded" />
            <div className="pt-2 border-t border-border-subtle flex justify-between items-center">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 8. WEBSITES SKELETON
// ============================================================================

export const WebsitesSkeleton: React.FC = () => {
  return (
    <div className="space-y-6" aria-label="Loading website audits" aria-busy="true">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
      <TableSkeleton rows={5} cols={5} />
    </div>
  );
};

// ============================================================================
// 9. DEALS SKELETON
// ============================================================================

export const DealsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6" aria-label="Loading deals pipeline" aria-busy="true">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-3 rounded-xl bg-bg-surface border border-border-subtle space-y-3 min-h-[350px]">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
            <div className="space-y-2.5">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="p-3 rounded-lg bg-bg-base border border-border-subtle space-y-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 10. REUSABLE EMPTY STATE COMPONENT
// ============================================================================

export interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}) => {
  return (
    <div
      className={cn(
        "p-8 sm:p-12 text-center rounded-xl bg-bg-surface border border-border-subtle flex flex-col items-center justify-center space-y-3 max-w-md mx-auto my-6",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-bg-base border border-border-subtle flex items-center justify-center text-text-tertiary">
        <Icon className="w-6 h-6 text-accent" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <p className="text-xs text-text-secondary max-w-sm">{description}</p>
      </div>
      {actionLabel && (
        <div className="pt-2">
          {actionHref ? (
            <a href={actionHref}>
              <Button variant="primary" size="sm" className="text-xs font-semibold bg-accent text-white">
                {actionLabel}
              </Button>
            </a>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onAction}
              className="text-xs font-semibold bg-accent text-white"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 11. REUSABLE ERROR STATE COMPONENT
// ============================================================================

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Unable to retrieve data",
  message = "An error occurred while communicating with the LeadEngine backend services.",
  onRetry,
  className,
}) => {
  return (
    <div
      role="alert"
      className={cn(
        "p-6 sm:p-8 text-center rounded-xl bg-rose-500/5 border border-rose-500/20 flex flex-col items-center justify-center space-y-3 max-w-md mx-auto my-6",
        className
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <p className="text-xs text-text-secondary">{message}</p>
      </div>
      {onRetry && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="text-xs font-semibold gap-1.5 border-border-default hover:border-accent text-text-primary"
          >
            <RefreshCw className="w-3.5 h-3.5 text-accent" />
            <span>Retry Request</span>
          </Button>
        </div>
      )}
    </div>
  );
};
