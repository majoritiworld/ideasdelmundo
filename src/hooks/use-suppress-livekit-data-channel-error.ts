"use client";

import { useEffect } from "react";

let originalConsoleError: typeof console.error | null = null;
let activeSuppressors = 0;

function isKnownLiveKitDataChannelError(args: unknown[]) {
  if (typeof args[0] !== "string") return false;

  return args[0] === "Unknown DataChannel error on lossy" || args[0] === "Unknown DataChannel error on reliable";
}

function isKnownElevenLabsErrorEventBug(event: ErrorEvent) {
  return (
    event.message.includes("Cannot read properties of undefined (reading 'error_type')") &&
    event.filename.includes("@elevenlabs_client")
  );
}

export function useSuppressLiveKitDataChannelError() {
  useEffect(() => {
    function handleWindowError(event: ErrorEvent) {
      if (!isKnownElevenLabsErrorEventBug(event)) return;

      event.preventDefault();
    }

    if (activeSuppressors === 0) {
      originalConsoleError = console.error;

      console.error = (...args: unknown[]) => {
        if (isKnownLiveKitDataChannelError(args)) return;
        originalConsoleError?.(...args);
      };
    }

    activeSuppressors += 1;
    window.addEventListener("error", handleWindowError);

    return () => {
      window.removeEventListener("error", handleWindowError);
      activeSuppressors -= 1;

      if (activeSuppressors === 0 && originalConsoleError) {
        console.error = originalConsoleError;
        originalConsoleError = null;
      }
    };
  }, []);
}
