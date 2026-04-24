import { useEffect, useRef } from "react";

// ----------------------------------------------------------------------

/**
 * Returns the previous value of any state or prop after a render.
 * Returns `undefined` on the first render.
 *
 * @example
 * const prevCount = usePrevious(count);
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  // eslint-disable-next-line react-hooks/refs
  return ref.current;
}
