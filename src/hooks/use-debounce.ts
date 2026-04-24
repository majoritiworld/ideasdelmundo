import { DEFAULT_REFRESH_INTERVAL } from "@/constants/app.constants";
import { useState, useEffect } from "react";

// ----------------------------------------------------------------------

export type UseDebounceReturn = string;

export function useDebounce(
  value: string,
  delay: number = DEFAULT_REFRESH_INTERVAL
): UseDebounceReturn {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
