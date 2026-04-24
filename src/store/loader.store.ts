import { create } from "zustand";

// ----------------------------------------------------------------------

interface LoaderState {
  /** Map of loading key → pending request count */
  keys: Record<string, number>;
  /** Increment pending count for a key (default: "global") */
  add: (key?: string) => void;
  /** Decrement pending count for a key (default: "global") */
  remove: (key?: string) => void;
}

const DEFAULT_KEY = "global";

export const useLoaderStore = create<LoaderState>((set) => ({
  keys: {},
  add: (key = DEFAULT_KEY) =>
    set((s) => ({
      keys: { ...s.keys, [key]: (s.keys[key] ?? 0) + 1 },
    })),
  remove: (key = DEFAULT_KEY) =>
    set((s) => ({
      keys: {
        ...s.keys,
        [key]: Math.max(0, (s.keys[key] ?? 1) - 1),
      },
    })),
}));

// ----------------------------------------------------------------------
// Selectors

/**
 * Returns true when any pending request exists across all keys,
 * or only for a specific named key when provided.
 *
 * @example
 * useIsLoading()           // any request pending
 * useIsLoading("saveForm") // only "saveForm" key
 */
export const useIsLoading = (key?: string) =>
  useLoaderStore((s) => {
    if (key) return (s.keys[key] ?? 0) > 0;
    return Object.values(s.keys).some((count) => count > 0);
  });
