import { cn } from "@/lib/utils";

export const WORD_REVEAL_INTERVAL_MS = 75;
export const WORD_REVEAL_TRANSITION_MS = 300;
export const WORD_REVEAL_EASING = [0.22, 1, 0.36, 1] as const;

export function splitRevealWords(text: string): string[] {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/g) : [];
}

export function getAnimatedWordClassName(isVisible: boolean, className?: string) {
  return cn(
    "inline transition-opacity duration-300 ease-out",
    isVisible ? "opacity-100" : "opacity-0",
    className
  );
}
