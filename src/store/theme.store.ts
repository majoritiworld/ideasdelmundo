"use client";

import { create } from "zustand";
import { getStorage, setStorage } from "@/hooks/use-local-storage";

// ----------------------------------------------------------------------

export type Theme = "light" | "dark";

const STORAGE_KEY = "app-theme";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  const stored = getStorage(STORAGE_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  setTheme: (theme) => {
    setStorage(STORAGE_KEY, theme);
    set({ theme });
  },
  toggle: () => {
    const next: Theme = get().theme === "light" ? "dark" : "light";
    get().setTheme(next);
  },
}));

/** Call once on app mount to sync with persisted/OS preference */
export const initTheme = () => {
  const theme = getInitialTheme();
  useThemeStore.getState().setTheme(theme);
};
