"use client";

import { useEffect, useRef, useState } from "react";

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  delay?: number;
  formatter?: (value: number) => string;
  className?: string;
};

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

/** At most two digits after the decimal point while animating (avoids long float tails). */
function toMaxTwoFractionDigits(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatDefault(n: number): string {
  const r = toMaxTwoFractionDigits(n);
  return r.toLocaleString(undefined, {
    useGrouping: false,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

const AnimatedNumber = ({
  value,
  duration = 900,
  delay = 0,
  formatter,
  className,
}: AnimatedNumberProps) => {
  const [display, setDisplay] = useState(() =>
    formatter ? formatter(toMaxTwoFractionDigits(0)) : formatDefault(0)
  );
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  /** Inline formatters from parents change identity every render; deps on them restart the animation forever. */
  const formatterRef = useRef(formatter);
  formatterRef.current = formatter;

  useEffect(() => {
    const timeout = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);
        const current = easedProgress * value;

        const stepped = toMaxTwoFractionDigits(current);
        const fmt = formatterRef.current;
        setDisplay(fmt ? fmt(stepped) : formatDefault(stepped));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      startTimeRef.current = null;
    };
  }, [value, duration, delay]);

  return <span className={className}>{display}</span>;
};

export default AnimatedNumber;
