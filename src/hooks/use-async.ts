"use client";

import { useCallback, useEffect, useState } from "react";

type AsyncState<T> = {
  data: T | undefined;
  isLoading: boolean;
  error: Error | undefined;
  execute: (...args: unknown[]) => Promise<void>;
  reset: () => void;
};

export function useAsync<T>(
  asyncFn: (...args: unknown[]) => Promise<T>,
  immediate = false
): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const execute = useCallback(
    async (...args: unknown[]) => {
      setIsLoading(true);
      setError(undefined);
      try {
        const result = await asyncFn(...args);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFn]
  );

  const reset = useCallback(() => {
    setData(undefined);
    setIsLoading(false);
    setError(undefined);
  }, []);

  useEffect(() => {
    if (immediate) execute();
  }, [immediate]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, isLoading, error, execute, reset };
}
