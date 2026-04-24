import type { ReactNode } from "react";

export type SelectOption = {
  label: string;
  value: string;
};

export type Tab = {
  label: string;
  value: string;
  icon: string;
};

export type MultiSelectOption = {
  label: string;
  value: string;
  color?: string;
  icon?: ReactNode;
  disabled?: boolean;
  /** Optional group label for rendering grouped sections. */
  group?: string;
  /** Optional nested options (for tree / folders). */
  children?: MultiSelectOption[];
};
