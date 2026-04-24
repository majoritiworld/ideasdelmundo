"use client";

import * as React from "react";
import { useDirection } from "@/components/app";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Iconify from "@/components/ui/iconify";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** How many page number buttons to show on each side of current (default 1) */
  siblingCount?: number;
  className?: string;
};

function generatePages(
  current: number,
  total: number,
  siblingCount: number
): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const left = Math.max(2, current - siblingCount);
  const right = Math.min(total - 1, current + siblingCount);
  const pages: (number | "ellipsis")[] = [1];

  if (left > 2) pages.push("ellipsis");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

/**
 * Pagination control with prev/next buttons and numbered pages.
 *
 * @example
 * <Pagination
 *   currentPage={page}
 *   totalPages={Math.ceil(total / pageSize)}
 *   onPageChange={setPage}
 * />
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const t = useTranslations();
  const dir = useDirection();
  if (totalPages <= 1) return null;

  const pages = generatePages(currentPage, totalPages, siblingCount);

  return (
    <nav aria-label={t("paginationAria")} className={cn("flex items-center gap-1", className)}>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        aria-label={t("previousPage")}
      >
        <Iconify
          icon={dir === "rtl" ? "lucide:chevron-right" : "lucide:chevron-left"}
          className="size-4"
        />
      </Button>

      {pages.map((page, i) =>
        page === "ellipsis" ? (
          <Typography
            key={`ellipsis-${i}`}
            variant="caption2"
            as="span"
            color="muted"
            className="px-1"
          >
            …
          </Typography>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="icon-sm"
            onClick={() => onPageChange(page)}
            aria-label={t("pageAria", { page })}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        aria-label={t("nextPage")}
      >
        <Iconify
          icon={dir === "rtl" ? "lucide:chevron-left" : "lucide:chevron-right"}
          className="size-4"
        />
      </Button>
    </nav>
  );
}
