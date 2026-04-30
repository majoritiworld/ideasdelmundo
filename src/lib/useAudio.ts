"use client";

import { useEffect, useRef } from "react";

const DEFAULT_VOICE_DELAY_MS = 500;

export function useAudio(
  src: string,
  options?: { enabled?: boolean; loop?: boolean; delayMs?: number }
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (options?.enabled === false) {
      audioRef.current = null;
      return;
    }

    const audio = new Audio(src);
    if (options?.loop) audio.loop = true;
    audioRef.current = audio;
    const delayMs = options?.delayMs ?? (options?.loop ? 0 : DEFAULT_VOICE_DELAY_MS);

    const timeoutId = window.setTimeout(() => {
      audio.play().catch(() => {
        console.log("[audio] autoplay blocked or file missing:", src);
      });
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [options?.delayMs, options?.enabled, options?.loop, src]);

  return audioRef;
}
