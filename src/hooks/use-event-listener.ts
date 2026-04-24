"use client";

import { useEffect, useRef, type RefObject } from "react";

type EventTarget = Window | Document | HTMLElement | null;

export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: RefObject<HTMLElement | null> | EventTarget,
  options?: AddEventListenerOptions
): void {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const target = element && "current" in element ? element.current : (element ?? window);

    if (!target || !target.addEventListener) return;

    const listener = (event: Event) => savedHandler.current(event as WindowEventMap[K]);

    target.addEventListener(eventName, listener, options);
    return () => target.removeEventListener(eventName, listener, options);
  }, [eventName, element, options]);
}
