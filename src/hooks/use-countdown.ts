"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ----------------------------------------------------------------------

export type UseCountdownReturn = {
  seconds: number;
  isRunning: boolean;
  start: (from?: number) => void;
  reset: () => void;
};

/**
 * Countdown timer that counts from `initialSeconds` down to 0.
 * Useful for OTP resend cooldowns, session expiry warnings, etc.
 *
 * @example
 * const { seconds, isRunning, start, reset } = useCountdown(60);
 * <Button disabled={isRunning} onClick={() => start()}>
 *   {isRunning ? `Resend in ${seconds}s` : "Resend code"}
 * </Button>
 */
export function useCountdown(initialSeconds = 60): UseCountdownReturn {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const start = useCallback(
    (from?: number) => {
      stop();
      const startFrom = from ?? initialSeconds;
      setSeconds(startFrom);
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            stop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [initialSeconds, stop]
  );

  const reset = useCallback(() => {
    stop();
    setSeconds(0);
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  return { seconds, isRunning, start, reset };
}
