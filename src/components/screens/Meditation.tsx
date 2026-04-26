"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Sphere from "@/components/Sphere";
import { cards } from "@/lib/cards";
import { EVENTS } from "@/lib/events";
import { useJourney } from "@/lib/journey-context";
import { logEvent, updateSession } from "@/lib/tracking";

const cues = ["Breathe in...", "Hold...", "Breathe out...", "Rest..."];

function getCurrentTimeMs() {
  return Date.now();
}

export default function Meditation() {
  const { state, dispatch } = useJourney();
  const [cueIndex, setCueIndex] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    startedAt.current = getCurrentTimeMs();
    void logEvent(state.sessionId, EVENTS.MEDITATION_STARTED);
    void updateSession(state.sessionId, { current_screen: "meditation" });

    const interval = window.setInterval(() => {
      setCueIndex((current) => (current + 1) % cues.length);
    }, 2000);

    return () => window.clearInterval(interval);
  }, [state.sessionId]);

  function returnToBoard() {
    const activeCard = cards.find((card) => card.id === state.activeCardId);
    const visitedCardIds =
      state.activeCardId === null ? state.visitedCardIds : Array.from(new Set([...state.visitedCardIds, state.activeCardId]));
    const durationMs = startedAt.current ? getCurrentTimeMs() - startedAt.current : 0;

    void logEvent(state.sessionId, EVENTS.MEDITATION_ENDED, {
      cardId: activeCard?.id,
      category: activeCard?.category,
      durationMs,
    });
    void updateSession(state.sessionId, {
      visited_card_ids: visitedCardIds,
      cards_explored_count: visitedCardIds.length,
    });

    if (state.activeCardId !== null) {
      dispatch({ type: "MARK_VISITED", id: state.activeCardId });
    }
    dispatch({ type: "GO_TO", screen: "board" });
  }

  return (
    <section className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 text-center sm:px-8">
      <Button
        type="button"
        variant="ghost"
        onClick={returnToBoard}
        className="absolute left-5 top-5 h-10 rounded-full border border-[#D5DCE6] bg-transparent px-4 text-[#5A6B82] hover:border-[#1B3DD4] hover:bg-white hover:text-[#1B3DD4] sm:left-8 sm:top-8"
      >
        ← Back to board
      </Button>

      <div className="m-auto flex flex-col items-center pt-16">
        <p className="mb-8 text-xs font-medium uppercase tracking-[0.12em] text-[#7B8FA8]">A breath together</p>
        <div className="meditation-pulse">
          <Sphere state="idle" variant="green" size={180} />
        </div>
        <p className="mt-10 text-xl font-medium text-[#0F1B2D]">{cues[cueIndex]}</p>
        <p className="mt-4 text-[15px] leading-[1.65] text-[#5A6B82]">Take 60 seconds. The board will wait.</p>
        <Button
          type="button"
          onClick={returnToBoard}
          className="mt-10 h-12 rounded-full bg-[#1B3DD4] px-7 text-white transition-all hover:-translate-y-px hover:bg-[#1632B0] active:scale-[0.98]"
        >
          Return to the board
        </Button>
      </div>

      <style jsx>{`
        .meditation-pulse {
          animation: meditation-scale 8s ease-in-out infinite;
        }

        @keyframes meditation-scale {
          0%,
          100% {
            transform: scale(0.85);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>
    </section>
  );
}
