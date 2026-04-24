"use client";

import { useEffect, useRef, useState } from "react";

type ScrollPosition = { x: number; y: number };

export function useScrollPosition(debounceMs = 50): ScrollPosition {
  const [position, setPosition] = useState<ScrollPosition>({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setPosition({ x: window.scrollX, y: window.scrollY });
      }, debounceMs);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [debounceMs]);

  return position;
}
