"use client";

import { useEffect, useState, type ReactNode } from "react";
import Lottie from "lottie-react";
import { cn } from "@/lib/utils";

type LottiePlayerProps = {
  animationPath: string;
  className?: string;
  fallback?: ReactNode;
  loop?: boolean;
  autoplay?: boolean;
};

const LottiePlayer = ({
  animationPath,
  className,
  fallback = null,
  loop = true,
  autoplay = true,
}: LottiePlayerProps) => {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadAnimation = async () => {
      try {
        setHasError(false);
        setAnimationData(null);

        const response = await fetch(animationPath);

        if (!response.ok) {
          throw new Error("Failed to load animation");
        }

        const data = (await response.json()) as object;

        if (!cancelled) {
          setAnimationData(data);
        }
      } catch {
        if (!cancelled) {
          setHasError(true);
        }
      }
    };

    void loadAnimation();

    return () => {
      cancelled = true;
    };
  }, [animationPath]);

  if (hasError || !animationData) {
    return <>{fallback}</>;
  }

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={cn(className)}
    />
  );
};

export default LottiePlayer;
