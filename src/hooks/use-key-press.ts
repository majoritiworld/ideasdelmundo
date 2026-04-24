"use client";

import type { RefObject } from "react";
import { useEventListener } from "./use-event-listener";

type UseKeyPressOptions = {
  enabled?: boolean;
  element?: RefObject<HTMLElement | null>;
};

export function useKeyPress(
  targetKey: string,
  handler: (event: KeyboardEvent) => void,
  options: UseKeyPressOptions = {}
): void {
  const { enabled = true, element } = options;

  useEventListener(
    "keydown",
    (event) => {
      if (enabled && event.key === targetKey) {
        handler(event as KeyboardEvent);
      }
    },
    element
  );
}
