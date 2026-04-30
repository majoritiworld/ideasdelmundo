"use client";

import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";

export interface SphereProps {
  state: "idle" | "listening" | "speaking" | "thinking" | "breathing";
  size?: number;
  variant?: "blue" | "lime" | "green" | "purple";
  breathPhase?: "inhale" | "hold" | "exhale" | "rest";
  circleColors?: readonly [string, string, string, string];
  circleOpacities?: readonly [number, number, number, number];
  disableHoverEffect?: boolean;
}

const SPHERE_SCALE = 1.25;
const SPEAKING_TO_IDLE_MS = 650;
const SPEAKING_TO_IDLE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

function isCircleElement(circle: HTMLDivElement | null): circle is HTMLDivElement {
  return Boolean(circle);
}

export default function Sphere({
  state,
  size = 200,
  variant = "lime",
  breathPhase = "rest",
  circleColors,
  circleOpacities,
  disableHoverEffect = false,
}: SphereProps) {
  const [visualState, setVisualState] = useState(state);
  const [isAssembling, setIsAssembling] = useState(false);
  const sphereRef = useRef<HTMLDivElement | null>(null);
  const circleRefs = useRef<Array<HTMLDivElement | null>>([]);
  const animationFrameRef = useRef<number | null>(null);
  const settlingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sphereStyle = {
    width: size * SPHERE_SCALE,
    height: size * SPHERE_SCALE,
  } as CSSProperties;

  function getCircleStyle(index: number): CSSProperties | undefined {
    if (!circleColors && !circleOpacities) return undefined;
    const opacity = circleOpacities?.[index];

    return {
      ...(circleColors ? { backgroundColor: circleColors[index] } : {}),
      ...(opacity !== undefined ? { opacity, zIndex: opacity > 0.3 ? 2 : 1 } : {}),
    };
  }

  const clearSettlingTimeout = useCallback(() => {
    if (settlingTimeoutRef.current) {
      clearTimeout(settlingTimeoutRef.current);
      settlingTimeoutRef.current = null;
    }
  }, []);

  const clearSnapshotStyles = useCallback(() => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (sphereRef.current) {
      sphereRef.current.style.animation = "";
      sphereRef.current.style.transform = "";
      sphereRef.current.style.transition = "";
    }

    circleRefs.current.forEach((circle) => {
      if (!circle) return;

      circle.style.animation = "";
      circle.style.transform = "";
      circle.style.transition = "";
    });
  }, []);

  useEffect(() => {
    if (state === visualState) return;

    clearSettlingTimeout();

    const sphere = sphereRef.current;
    const circles = circleRefs.current.filter(isCircleElement);

    if (visualState === "speaking" && state === "idle" && sphere && circles.length > 0) {
      const sphereTransform = window.getComputedStyle(sphere).transform;

      sphere.style.animation = "none";
      sphere.style.transition = "none";
      sphere.style.transform = sphereTransform === "none" ? "" : sphereTransform;

      circles.forEach((circle) => {
        const circleTransform = window.getComputedStyle(circle).transform;

        circle.style.animation = "none";
        circle.style.transition = "none";
        circle.style.transform = circleTransform === "none" ? "" : circleTransform;
      });

      animationFrameRef.current = window.requestAnimationFrame(() => {
        setVisualState("idle");

        animationFrameRef.current = window.requestAnimationFrame(() => {
          sphere.style.transition = `transform ${SPEAKING_TO_IDLE_MS}ms ${SPEAKING_TO_IDLE_EASING}`;
          sphere.style.transform = "";

          circles.forEach((circle) => {
            circle.style.transition = `transform ${SPEAKING_TO_IDLE_MS}ms ${SPEAKING_TO_IDLE_EASING}, opacity ${SPEAKING_TO_IDLE_MS}ms ${SPEAKING_TO_IDLE_EASING}`;
            circle.style.transform = "";
          });

          animationFrameRef.current = null;
        });
      });

      settlingTimeoutRef.current = setTimeout(() => {
        clearSnapshotStyles();
        settlingTimeoutRef.current = null;
      }, SPEAKING_TO_IDLE_MS);

      return;
    }

    clearSnapshotStyles();
    animationFrameRef.current = window.requestAnimationFrame(() => {
      setVisualState(state);
      animationFrameRef.current = null;
    });
  }, [clearSettlingTimeout, clearSnapshotStyles, state, visualState]);

  useEffect(() => {
    return () => {
      clearSettlingTimeout();
      clearSnapshotStyles();
    };
  }, [clearSettlingTimeout, clearSnapshotStyles]);

  function handleMouseEnter() {
    if (disableHoverEffect) return;
    if (isAssembling) return;

    const sphere = sphereRef.current;
    const circles = circleRefs.current.filter(isCircleElement);

    if (!sphere || circles.length === 0) {
      setIsAssembling(true);
      return;
    }

    const sphereTransform = window.getComputedStyle(sphere).transform;

    sphere.style.animation = "none";
    sphere.style.transition = "none";
    sphere.style.transform = sphereTransform === "none" ? "" : sphereTransform;

    circles.forEach((circle) => {
      const circleTransform = window.getComputedStyle(circle).transform;

      circle.style.animation = "none";
      circle.style.transition = "none";
      circle.style.transform = circleTransform === "none" ? "" : circleTransform;
    });

    void sphere.offsetWidth;
    setIsAssembling(true);

    animationFrameRef.current = window.requestAnimationFrame(() => {
      sphere.style.animation = "";
      sphere.style.transform = "";
      sphere.style.transition = "";

      circles.forEach((circle) => {
        circle.style.animation = "";
        circle.style.transform = "";
        circle.style.transition = "";
      });

      animationFrameRef.current = null;
    });
  }

  function handleMouseLeave() {
    if (disableHoverEffect) return;
    clearSnapshotStyles();
    setIsAssembling(false);
  }

  return (
    <div
      ref={sphereRef}
      aria-label={`${visualState} guide sphere`}
      className={`sphere sphere--${visualState} sphere--${variant} sphere--${breathPhase}${
        isAssembling ? " sphere--assembling" : ""
      }`}
      data-state={visualState}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={sphereStyle}
    >
      <div
        ref={(node) => void (circleRefs.current[0] = node)}
        className="sphere__circle sphere__circle--1"
        style={getCircleStyle(0)}
      />
      <div
        ref={(node) => void (circleRefs.current[1] = node)}
        className="sphere__circle sphere__circle--2"
        style={getCircleStyle(1)}
      />
      <div
        ref={(node) => void (circleRefs.current[2] = node)}
        className="sphere__circle sphere__circle--3"
        style={getCircleStyle(2)}
      />
      <div
        ref={(node) => void (circleRefs.current[3] = node)}
        className="sphere__circle sphere__circle--4"
        style={getCircleStyle(3)}
      />

      <style jsx>{`
        .sphere {
          position: relative;
          color: #c5d94a;
          transform-origin: center;
          will-change: transform;
        }

        .sphere--blue {
          color: #1b3dd4;
        }

        .sphere--lime {
          color: #c5d94a;
        }

        .sphere--green {
          color: #9f77dd;
        }

        .sphere--purple {
          color: #9f77dd;
        }

        .sphere__circle {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 70%;
          height: 70%;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.3;
          transform-origin: center;
          transition: all 0.6s ease;
          will-change: transform, opacity;
        }

        .sphere__circle--1 {
          transform: translateX(-50%) translateY(-71.5%);
        }

        .sphere__circle--2 {
          transform: translateX(-50%) translateY(-28.5%);
        }

        .sphere__circle--3 {
          transform: translateX(-71.5%) translateY(-50%);
        }

        .sphere__circle--4 {
          transform: translateX(-28.5%) translateY(-50%);
        }

        .sphere[data-state="idle"] .sphere__circle--1 {
          animation: sphere-idle-1 8s ease-in-out infinite;
        }

        .sphere[data-state="idle"] .sphere__circle--2 {
          animation: sphere-idle-2 9s ease-in-out infinite;
        }

        .sphere[data-state="idle"] .sphere__circle--3 {
          animation: sphere-idle-3 10s ease-in-out infinite;
        }

        .sphere[data-state="idle"] .sphere__circle--4 {
          animation: sphere-idle-4 11s ease-in-out infinite;
        }

        .sphere--listening {
          animation: sphere-listening-pulse 1.9s ease-in-out infinite;
        }

        .sphere[data-state="listening"] .sphere__circle {
          animation: sphere-listening-presence 1.9s ease-in-out infinite;
        }

        .sphere[data-state="listening"] .sphere__circle--2 {
          animation-delay: -0.18s;
        }

        .sphere[data-state="listening"] .sphere__circle--3 {
          animation-delay: -0.36s;
        }

        .sphere[data-state="listening"] .sphere__circle--4 {
          animation-delay: -0.54s;
        }

        .sphere--speaking {
          animation: sphere-group-spin 3.6s linear infinite;
        }

        .sphere[data-state="speaking"] .sphere__circle--1 {
          animation: sphere-speak-1 1.44s ease-in-out infinite;
        }

        .sphere[data-state="speaking"] .sphere__circle--2 {
          animation: sphere-speak-2 1.44s ease-in-out infinite;
          animation-delay: -0.36s;
        }

        .sphere[data-state="speaking"] .sphere__circle--3 {
          animation: sphere-speak-3 1.44s ease-in-out infinite;
          animation-delay: -0.72s;
        }

        .sphere[data-state="speaking"] .sphere__circle--4 {
          animation: sphere-speak-4 1.44s ease-in-out infinite;
          animation-delay: -1.08s;
        }

        .sphere[data-state="thinking"] .sphere__circle--1 {
          animation: sphere-think-1 4s ease-in-out infinite;
        }

        .sphere[data-state="thinking"] .sphere__circle--2 {
          animation: sphere-think-2 4s ease-in-out infinite;
        }

        .sphere[data-state="thinking"] .sphere__circle--3 {
          animation: sphere-think-3 4s ease-in-out infinite;
        }

        .sphere[data-state="thinking"] .sphere__circle--4 {
          animation: sphere-think-4 4s ease-in-out infinite;
        }

        .sphere--breathing .sphere__circle {
          animation: none;
        }

        .sphere--assembling {
          animation: none;
        }

        .sphere--assembling .sphere__circle {
          animation: none !important;
          transition: all 2.4s ease;
        }

        .sphere--assembling .sphere__circle--1 {
          transform: translateX(-50%) translateY(-71.5%);
        }

        .sphere--assembling .sphere__circle--2 {
          transform: translateX(-50%) translateY(-28.5%);
        }

        .sphere--assembling .sphere__circle--3 {
          transform: translateX(-71.5%) translateY(-50%);
        }

        .sphere--assembling .sphere__circle--4 {
          transform: translateX(-28.5%) translateY(-50%);
        }

        .sphere--breathing.sphere--inhale .sphere__circle,
        .sphere--breathing.sphere--exhale .sphere__circle {
          transition-duration: 6s;
        }

        .sphere--breathing.sphere--inhale .sphere__circle--1,
        .sphere--breathing.sphere--hold .sphere__circle--1 {
          transform: translateX(-50%) translateY(-80%);
        }

        .sphere--breathing.sphere--inhale .sphere__circle--2,
        .sphere--breathing.sphere--hold .sphere__circle--2 {
          transform: translateX(-50%) translateY(-20%);
        }

        .sphere--breathing.sphere--inhale .sphere__circle--3,
        .sphere--breathing.sphere--hold .sphere__circle--3 {
          transform: translateX(-80%) translateY(-50%);
        }

        .sphere--breathing.sphere--inhale .sphere__circle--4,
        .sphere--breathing.sphere--hold .sphere__circle--4 {
          transform: translateX(-20%) translateY(-50%);
        }

        .sphere--breathing.sphere--exhale .sphere__circle--1,
        .sphere--breathing.sphere--rest .sphere__circle--1 {
          transform: translateX(-50%) translateY(-71.5%);
        }

        .sphere--breathing.sphere--exhale .sphere__circle--2,
        .sphere--breathing.sphere--rest .sphere__circle--2 {
          transform: translateX(-50%) translateY(-28.5%);
        }

        .sphere--breathing.sphere--exhale .sphere__circle--3,
        .sphere--breathing.sphere--rest .sphere__circle--3 {
          transform: translateX(-71.5%) translateY(-50%);
        }

        .sphere--breathing.sphere--exhale .sphere__circle--4,
        .sphere--breathing.sphere--rest .sphere__circle--4 {
          transform: translateX(-28.5%) translateY(-50%);
        }

        @keyframes sphere-group-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes sphere-listening-pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.06);
          }
        }

        @keyframes sphere-listening-presence {
          0%,
          100% {
            opacity: 0.28;
          }
          50% {
            opacity: 0.42;
          }
        }

        @keyframes sphere-idle-1 {
          0%,
          100% {
            transform: translateX(-50%) translateY(-71.5%) translate(0, 0);
          }
          33% {
            transform: translateX(-50%) translateY(-71.5%) translate(5px, -3px);
          }
          66% {
            transform: translateX(-50%) translateY(-71.5%) translate(-4px, 6px);
          }
        }

        @keyframes sphere-idle-2 {
          0%,
          100% {
            transform: translateX(-50%) translateY(-28.5%) translate(0, 0);
          }
          35% {
            transform: translateX(-50%) translateY(-28.5%) translate(-6px, 3px);
          }
          70% {
            transform: translateX(-50%) translateY(-28.5%) translate(4px, -5px);
          }
        }

        @keyframes sphere-idle-3 {
          0%,
          100% {
            transform: translateX(-71.5%) translateY(-50%) translate(0, 0);
          }
          40% {
            transform: translateX(-71.5%) translateY(-50%) translate(-3px, -6px);
          }
          72% {
            transform: translateX(-71.5%) translateY(-50%) translate(6px, 4px);
          }
        }

        @keyframes sphere-idle-4 {
          0%,
          100% {
            transform: translateX(-28.5%) translateY(-50%) translate(0, 0);
          }
          30% {
            transform: translateX(-28.5%) translateY(-50%) translate(4px, 6px);
          }
          68% {
            transform: translateX(-28.5%) translateY(-50%) translate(-6px, -4px);
          }
        }

        @keyframes sphere-speak-1 {
          0%,
          100% {
            transform: translateX(-50%) translateY(-71.5%) scale(1);
          }
          50% {
            transform: translateX(-50%) translateY(-71.5%) scale(1.08);
          }
        }

        @keyframes sphere-speak-2 {
          0%,
          100% {
            transform: translateX(-50%) translateY(-28.5%) scale(1);
          }
          50% {
            transform: translateX(-50%) translateY(-28.5%) scale(1.08);
          }
        }

        @keyframes sphere-speak-3 {
          0%,
          100% {
            transform: translateX(-71.5%) translateY(-50%) scale(1);
          }
          50% {
            transform: translateX(-71.5%) translateY(-50%) scale(1.08);
          }
        }

        @keyframes sphere-speak-4 {
          0%,
          100% {
            transform: translateX(-28.5%) translateY(-50%) scale(1);
          }
          50% {
            transform: translateX(-28.5%) translateY(-50%) scale(1.08);
          }
        }

        @keyframes sphere-think-1 {
          0%,
          100% {
            transform: translateX(-50%) translateY(-71.5%);
          }
          50% {
            transform: translateX(-50%) translateY(-65%);
          }
        }

        @keyframes sphere-think-2 {
          0%,
          100% {
            transform: translateX(-50%) translateY(-28.5%);
          }
          50% {
            transform: translateX(-50%) translateY(-35%);
          }
        }

        @keyframes sphere-think-3 {
          0%,
          100% {
            transform: translateX(-71.5%) translateY(-50%);
          }
          50% {
            transform: translateX(-65%) translateY(-50%);
          }
        }

        @keyframes sphere-think-4 {
          0%,
          100% {
            transform: translateX(-28.5%) translateY(-50%);
          }
          50% {
            transform: translateX(-35%) translateY(-50%);
          }
        }
      `}</style>
    </div>
  );
}
