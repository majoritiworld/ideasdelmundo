"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";

// ----------------------------------------------------------------------

export type WindowSize = {
  width: number;
  height: number;
};

/**
 * Returns debounced window dimensions, updated on resize.
 * Safe to call on server (returns 0×0 until hydration).
 *
 * @example
 * const { width, height } = useWindowSize();
 * const isMobile = width < 768;
 */
export function useWindowSize(debounceMs = 150): WindowSize {
  const [size, setSize] = useState<WindowSize>({ width: 0, height: 0 });
  const debouncedWidth = useDebounce(String(size.width), debounceMs);

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return { width: Number(debouncedWidth), height: size.height };
}
