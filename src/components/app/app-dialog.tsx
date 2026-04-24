"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface AppDialogProps {
  /** Trigger element - if provided, dialog opens on click */
  trigger?: React.ReactNode;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Dialog title */
  title?: React.ReactNode;
  /** Optional description */
  description?: React.ReactNode;
  /** Dialog body content */
  children: React.ReactNode;
  /** Footer actions - pass Button components */
  footer?: React.ReactNode;
  /** Show default Close button in footer */
  showCloseButton?: boolean;
  /** Callback when Close is clicked */
  onClose?: () => void;
  /** Additional class for content */
  className?: string;
  /** Max width: sm | md | lg | xl | full */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Show close X button in header */
  showCloseX?: boolean;
}

const sizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  full: "sm:max-w-[calc(100vw-2rem)]",
};

export function AppDialog({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  showCloseButton = false,
  onClose,
  className,
  size = "lg",
  showCloseX = true,
}: AppDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
    if (!nextOpen) onClose?.();
  };

  const content = (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={cn(sizeClasses[size], className)} showCloseButton={showCloseX}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        <div className={cn(!title && !description && "pt-0")}>{children}</div>
        {(footer || showCloseButton) && (
          <DialogFooter showCloseButton={showCloseButton}>{footer}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );

  return content;
}
