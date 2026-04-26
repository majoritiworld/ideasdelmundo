"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { type Card, categoryColors } from "@/lib/cards";

interface FloatingCardProps {
  card: Card;
  index: number;
  visited: boolean;
  onClick: () => void;
}

export default function FloatingCard({ card, index, visited, onClick }: FloatingCardProps) {
  const duration = 14 + (index % 5) * 2;
  const delay = index * -0.8;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`floating-card group absolute max-w-[190px] rounded-[18px] border px-4 py-3 text-left transition-all duration-300 ease-out sm:max-w-[220px] sm:px-[18px] sm:py-3.5 ${
        visited
          ? "border-[#B5C6F4] bg-[#EEF2FE] text-[#5A6B82]"
          : "border-[#D5DCE6] bg-white text-[#0F1B2D] hover:border-[#1B3DD4] hover:shadow-[0_12px_32px_-16px_rgba(27,61,212,0.25)]"
      }`}
      style={
        {
          "--x": `${card.x}%`,
          "--y": `${card.y}%`,
          "--mobile-x": `${Math.min(74, Math.max(5, card.x * 0.78 + 8))}%`,
          "--mobile-y": `${Math.min(84, Math.max(10, card.y * 0.86 + 8))}%`,
          "--duration": `${duration}s`,
          "--delay": `${delay}s`,
        } as CSSProperties
      }
    >
      {visited && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, ease: [0.2, 1.4, 0.4, 1] }}
          className="absolute -right-2 -top-2 grid size-[22px] place-items-center rounded-full border-2 border-white bg-[#1D9E75]"
        >
          <svg viewBox="0 0 16 16" className="size-3 text-white" aria-hidden>
            <path d="M6.4 11.2 3 7.8l1.1-1.1 2.3 2.3 5.5-5.5L13 4.6z" fill="currentColor" />
          </svg>
        </motion.span>
      )}
      <span
        className={`mb-2 block text-[10px] font-medium uppercase tracking-[0.12em] ${
          visited ? "text-[#5A6B82]" : "text-[#7B8FA8]"
        }`}
        style={{ color: visited ? "#5A6B82" : categoryColors[card.category] }}
      >
        {card.categoryLabel}
      </span>
      <span className={`block text-sm font-medium leading-snug ${visited ? "text-[#5A6B82]" : "text-[#0F1B2D]"}`}>
        {card.question}
      </span>
      <style jsx>{`
        .floating-card {
          left: var(--mobile-x);
          top: var(--mobile-y);
          animation: drift var(--duration) ease-in-out var(--delay) infinite;
        }

        .floating-card:hover {
          animation-play-state: paused;
          transform: translate3d(-50%, calc(-50% - 4px), 0) scale(1.04) !important;
        }

        .floating-card:active {
          transform: translate3d(-50%, calc(-50% - 2px), 0) scale(0.98) !important;
        }

        @media (min-width: 768px) {
          .floating-card {
            left: var(--x);
            top: var(--y);
          }
        }

        @keyframes drift {
          0%,
          100% {
            transform: translate3d(-50%, -50%, 0) rotate(-1deg);
          }
          33% {
            transform: translate3d(calc(-50% + 8px), calc(-50% - 10px), 0) rotate(1deg);
          }
          66% {
            transform: translate3d(calc(-50% - 8px), calc(-50% + 9px), 0) rotate(-0.5deg);
          }
        }
      `}</style>
    </button>
  );
}
