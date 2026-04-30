"use client";

import { useEffect, useRef } from "react";

const DEFAULT_VOICE_DELAY_MS = 500;

type AudioPause = {
  atMs: number;
  durationMs: number;
};

export function useAudio(
  src: string,
  options?: {
    enabled?: boolean;
    loop?: boolean;
    delayMs?: number;
    pauses?: readonly AudioPause[];
  }
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
    let pauseTimeoutId: number | null = null;
    let nextPauseIndex = 0;

    const handleTimeUpdate = () => {
      const pauses = options?.pauses;
      if (!pauses?.length || audio.paused) return;

      const nextPause = pauses[nextPauseIndex];
      if (!nextPause || audio.currentTime * 1_000 < nextPause.atMs) return;

      nextPauseIndex += 1;
      audio.pause();
      pauseTimeoutId = window.setTimeout(() => {
        audio.play().catch(() => {
          console.log("[audio] autoplay blocked or file missing:", src);
        });
      }, nextPause.durationMs);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);

    const timeoutId = window.setTimeout(() => {
      audio.play().catch(() => {
        console.log("[audio] autoplay blocked or file missing:", src);
      });
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
      if (pauseTimeoutId) window.clearTimeout(pauseTimeoutId);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [options?.delayMs, options?.enabled, options?.loop, options?.pauses, src]);

  return audioRef;
}
