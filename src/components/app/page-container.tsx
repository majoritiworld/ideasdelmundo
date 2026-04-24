import * as React from "react";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import Actions from "../demo/layout/actions";

// ----------------------------------------------------------------------

export type PageContainerProps = {
  /** Page title text */
  title?: React.ReactNode;
  /** Optional subtitle or breadcrumb below the title */
  subtitle?: React.ReactNode;
  /** Page body content */
  children: React.ReactNode;
  className?: string;
  /** Max-width class (default: "max-w-7xl") */
  maxWidth?: string;
};

/**
 * Standard page layout wrapper with title, subtitle, actions, and content.
 *
 * @example
 * <PageContainer
 *   title="Users"
 *   subtitle="Manage your team"
 *   actions={<Button>Invite</Button>}
 * >
 *   <DataTable ... />
 * </PageContainer>
 */
export function PageContainer({
  title,
  subtitle,
  children,
  className,
  maxWidth = "max-w-7xl",
}: PageContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-4 py-8 sm:px-6 lg:px-8", maxWidth, className)}>
      {title && (
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {title && (
              <Typography
                variant="subtitle1"
                as="h1"
                className="text-foreground text-2xl font-bold tracking-tight"
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption2" as="p" color="muted">
                {subtitle}
              </Typography>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Actions />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
