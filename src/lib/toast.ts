"use client";

import * as React from "react";
import { toast as sonnerToast } from "sonner";
import { ToastSuccessIcon, ToastErrorIcon, ToastWarningIcon } from "@/components/ui/toast-icons";

/** Success toast - green checkmark */
export function toastSuccess(message: string, description?: string) {
  return sonnerToast.success(message, {
    description,
    icon: React.createElement(ToastSuccessIcon),
  });
}

/** Error toast - red X */
export function toastError(message: string, description?: string) {
  return sonnerToast.error(message, {
    description,
    icon: React.createElement(ToastErrorIcon),
  });
}

/** Info toast */
export function toastInfo(message: string, description?: string) {
  return sonnerToast.info(message, { description });
}

/** Warning toast */
export function toastWarning(message: string, description?: string) {
  return sonnerToast.warning(message, {
    description,
    icon: React.createElement(ToastWarningIcon),
  });
}

/** Loading toast - returns id to dismiss/update */
export function toastLoading(message: string) {
  return sonnerToast.loading(message);
}

/** Dismiss a toast by id */
export function toastDismiss(id?: string | number) {
  return sonnerToast.dismiss(id);
}

/** Promise toast - shows loading, then success/error */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: unknown) => string);
  }
) {
  return sonnerToast.promise(promise, messages);
}

/** Re-export sonner toast for custom usage */
export { sonnerToast as toast };
