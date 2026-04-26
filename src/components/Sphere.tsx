"use client";

import { CSSProperties } from "react";

export interface SphereProps {
  state: "idle" | "listening" | "speaking" | "thinking";
  size?: number;
  intensity?: number;
  variant?: "blue" | "green";
  className?: string;
  style?: CSSProperties;
}

function clampIntensity(value: number) {
  return Math.max(0, Math.min(1, value));
}

export default function Sphere({ state, size = 160, intensity = 0, variant = "blue", className = "", style }: SphereProps) {
  const sphereIntensity = clampIntensity(intensity);
  const sphereStyle = {
    "--sphere-intensity": sphereIntensity.toFixed(3),
    "--sphere-glow": `${18 + sphereIntensity * 46}px`,
    width: size,
    height: size,
    ...style,
  } as CSSProperties;

  return (
    <div
      aria-label={`${state} guide sphere`}
      className={`majoriti-sphere ${state} ${variant} ${className}`}
      style={sphereStyle}
    >
      <style jsx>{`
        .majoriti-sphere {
          position: relative;
          isolation: isolate;
          border-radius: 50%;
          overflow: hidden;
          filter: blur(0.5px);
          transform-origin: center;
          will-change: transform, box-shadow;
        }

        .majoriti-sphere.blue {
          background: radial-gradient(circle at 35% 30%, #6fa3ff 0%, #3056e8 35%, #1b3dd4 65%, #0e2ba8 100%);
        }

        .majoriti-sphere.green {
          background: radial-gradient(circle at 40% 35%, #9fe1cb 0%, #1d9e75 72%, #117755 100%);
        }

        .majoriti-sphere::before,
        .majoriti-sphere::after {
          content: "";
          position: absolute;
          inset: 8%;
          z-index: -1;
          border-radius: 48% 52% 55% 45% / 50% 48% 52% 50%;
          opacity: 0.72;
          mix-blend-mode: screen;
          will-change: transform, border-radius;
        }

        .majoriti-sphere::before {
          background: radial-gradient(circle at 38% 36%, rgba(255, 255, 255, 0.9), rgba(111, 163, 255, 0.18) 44%, transparent 68%);
          animation: liquid-one 8s ease-in-out infinite;
        }

        .majoriti-sphere::after {
          inset: 16%;
          background: radial-gradient(circle at 64% 66%, rgba(14, 43, 168, 0.42), rgba(255, 255, 255, 0.2) 48%, transparent 70%);
          animation: liquid-two 10s ease-in-out infinite reverse;
        }

        .majoriti-sphere.idle {
          animation: breathe 4.5s ease-in-out infinite;
        }

        .majoriti-sphere.listening {
          animation: listen 1.8s ease-out infinite;
        }

        .majoriti-sphere.speaking {
          animation: speak 0.9s ease-in-out infinite;
          box-shadow:
            0 0 var(--sphere-glow) rgba(27, 61, 212, calc(0.22 + var(--sphere-intensity) * 0.32)),
            inset 0 0 36px rgba(255, 255, 255, calc(0.18 + var(--sphere-intensity) * 0.22));
        }

        .majoriti-sphere.thinking {
          animation: think 3s ease-in-out infinite;
          box-shadow: inset 0 0 44px rgba(15, 27, 45, 0.22);
        }

        @keyframes breathe {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.04);
          }
        }

        @keyframes listen {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(27, 61, 212, 0.25);
          }
          70% {
            transform: scale(1.035);
            box-shadow: 0 0 0 28px rgba(27, 61, 212, 0);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(27, 61, 212, 0);
          }
        }

        @keyframes speak {
          0%,
          100% {
            transform: scale(calc(1 + var(--sphere-intensity) * 0.04)) rotate(0deg);
          }
          35% {
            transform: scale(calc(1.045 + var(--sphere-intensity) * 0.12)) rotate(2deg);
          }
          68% {
            transform: scale(calc(0.985 + var(--sphere-intensity) * 0.06)) rotate(-1.5deg);
          }
        }

        @keyframes think {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
            filter: blur(0.5px) saturate(0.92);
          }
          50% {
            transform: scale(1.025) rotate(3deg);
            filter: blur(0.5px) saturate(0.78);
          }
        }

        @keyframes liquid-one {
          0%,
          100% {
            transform: rotate(0deg) scale(1);
            border-radius: 48% 52% 55% 45% / 50% 48% 52% 50%;
          }
          50% {
            transform: rotate(165deg) scale(1.12);
            border-radius: 58% 42% 47% 53% / 44% 58% 42% 56%;
          }
        }

        @keyframes liquid-two {
          0%,
          100% {
            transform: rotate(0deg) scale(1);
            border-radius: 52% 48% 44% 56% / 58% 46% 54% 42%;
          }
          50% {
            transform: rotate(-140deg) scale(1.2);
            border-radius: 42% 58% 54% 46% / 45% 52% 48% 55%;
          }
        }
      `}</style>
    </div>
  );
}
