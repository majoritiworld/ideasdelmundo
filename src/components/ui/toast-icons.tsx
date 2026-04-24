"use client";

import Iconify from "./iconify";

export function ToastSuccessIcon() {
  return <Iconify icon="lucide:check-circle" className="size-5 text-green-600" />;
}

export function ToastErrorIcon() {
  return <Iconify icon="lucide:x-circle" className="text-destructive size-5" />;
}

export function ToastWarningIcon() {
  return <Iconify icon="lucide:alert-triangle" className="size-5 text-orange-500" />;
}
