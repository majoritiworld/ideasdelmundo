"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Iconify from "@/components/ui/iconify";

interface PdfPreviewProps {
  file: File;
  className?: string;
}

export const PdfPreview = React.forwardRef<HTMLDivElement, PdfPreviewProps>(
  ({ file, className }, ref) => {
    const content = (
      <div
        ref={ref}
        className={cn(
          "flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800",
          className
        )}
      >
        <Iconify icon="lucide:file-text" className="size-12 text-slate-400 dark:text-slate-500" />
      </div>
    );

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-default">{content}</div>
        </TooltipTrigger>
        <TooltipContent side="top" className="break-all">
          {file.name}
        </TooltipContent>
      </Tooltip>
    );
  }
);
PdfPreview.displayName = "PdfPreview";
