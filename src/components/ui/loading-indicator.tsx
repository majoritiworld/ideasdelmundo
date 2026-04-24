"use client";

import * as React from "react";
import { useIsLoading } from "@/store/loader.store";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------

export type LoadingVariant = "spinner" | "overlay" | "skeleton" | "disabled";

export type LoadingIndicatorProps = {
  /**
   * - `"spinner"` (default) — small animated spinner, never blocks UI
   * - `"overlay"` — semi-transparent full-screen overlay; use for heavy ops
   * - `"skeleton"` — renders skeleton placeholder children
   * - `"disabled"` — no visual; use with `children` to disable a region
   */
  variant?: LoadingVariant;
  /**
   * Named loading key to watch. Defaults to watching ALL keys (any pending).
   * Use a specific key (e.g. "axios") to scope the indicator.
   */
  loadingKey?: string;
  /** Used by "skeleton" and "disabled" variants to wrap content */
  children?: React.ReactNode;
  /** Additional className (applied to the wrapper) */
  className?: string;
  /** Spinner size class override (e.g. "size-8") */
  spinnerClassName?: string;
  /** Number of skeleton rows when variant="skeleton" and no children given */
  skeletonRows?: number;
};

/**
 * Smart loading indicator with four variants.
 *
 * @example
 * // Inline spinner (default) — shows when any request is pending
 * <LoadingIndicator />
 *
 * // Full-screen overlay only for Axios mutations
 * <LoadingIndicator variant="overlay" loadingKey="axios" />
 *
 * // Skeleton placeholder while data loads
 * <LoadingIndicator variant="skeleton" skeletonRows={3} />
 *
 * // Disable a region while saving
 * <LoadingIndicator variant="disabled" loadingKey="saveForm">
 *   <MyForm />
 * </LoadingIndicator>
 */
export function LoadingIndicator({
  variant = "spinner",
  loadingKey,
  children,
  className,
  spinnerClassName,
  skeletonRows = 3,
}: LoadingIndicatorProps) {
  const isLoading = useIsLoading(loadingKey);

  // ─── spinner ──────────────────────────────────────────────────────────
  if (variant === "spinner") {
    if (!isLoading) return null;
    return (
      <div
        role="status"
        aria-label="Loading"
        className={cn("flex items-center justify-center", className)}
      >
        <Spinner className={cn("size-5", spinnerClassName)} />
      </div>
    );
  }

  // ─── overlay ──────────────────────────────────────────────────────────
  if (variant === "overlay") {
    if (!isLoading) return null;
    return (
      <div
        role="status"
        aria-label="Loading"
        className={cn(
          "bg-background/60 fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm",
          className
        )}
      >
        <div className="bg-card rounded-xl border p-6 shadow-xl">
          <Spinner className={cn("size-8", spinnerClassName)} />
        </div>
      </div>
    );
  }

  // ─── skeleton ─────────────────────────────────────────────────────────
  if (variant === "skeleton") {
    if (!isLoading) return <>{children}</>;
    if (children) {
      return (
        <div role="status" aria-label="Loading" className={cn("animate-pulse", className)}>
          {children}
        </div>
      );
    }
    return (
      <div role="status" aria-label="Loading" className={cn("flex flex-col gap-3", className)}>
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <Skeleton key={i} className={cn("h-4 w-full", i === skeletonRows - 1 && "w-3/4")} />
        ))}
      </div>
    );
  }

  // ─── disabled ─────────────────────────────────────────────────────────
  if (variant === "disabled") {
    return (
      <div
        className={cn("relative", isLoading && "pointer-events-none select-none", className)}
        aria-busy={isLoading}
      >
        {children}
        {isLoading && <div className="bg-background/30 absolute inset-0 rounded-[inherit]" />}
      </div>
    );
  }

  return null;
}
