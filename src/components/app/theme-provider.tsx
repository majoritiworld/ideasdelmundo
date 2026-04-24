"use client";

import { useEffect } from "react";
import { useThemeStore, initTheme } from "@/store/theme.store";

// ----------------------------------------------------------------------

/**
 * Reads the persisted theme on mount, applies `.dark` to <html>,
 * and keeps it in sync whenever the store changes.
 *
 * Drop this inside RootLayout above everything else.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    initTheme();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return <>{children}</>;
}
