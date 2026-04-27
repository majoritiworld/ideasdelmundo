"use client";

import { useEffect, useRef } from "react";

export function useAudio(src: string, options?: { loop?: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    if (options?.loop) audio.loop = true;
    audioRef.current = audio;

    audio.play().catch(() => {
      console.log("[audio] autoplay blocked or file missing:", src);
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [options?.loop, src]);

  return audioRef;
}
