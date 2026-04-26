"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import FloatingCard from "@/components/FloatingCard";
import Sphere from "@/components/Sphere";
import { type Card, cards } from "@/lib/cards";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce } from "@/lib/journey-context";
import { logEvent, updateSession } from "@/lib/tracking";

function getCurrentTimeMs() {
  return Date.now();
}

export default function Board() {
  const { state, dispatch } = useJourney();
  const logBoardViewed = useLogEventOnce(EVENTS.BOARD_VIEWED);
  const visitedCount = state.visitedCardIds.length;

  useEffect(() => {
    void logBoardViewed();
    void updateSession(state.sessionId, { current_screen: "board" });
  }, [logBoardViewed, state.sessionId]);

  function openCard(card: Card) {
    const openedAt = getCurrentTimeMs();

    void logEvent(state.sessionId, EVENTS.CARD_OPENED, {
      cardId: card.id,
      category: card.category,
    });

    if (!state.firstCardOpenedAt) {
      const timestamp = new Date(openedAt).toISOString();
      dispatch({ type: "SET_FIRST_CARD_OPENED_AT", timestamp });
      void updateSession(state.sessionId, { first_card_opened_at: timestamp });
    }

    dispatch({ type: "SET_ACTIVE_CARD", id: card.id, openedAt });
    dispatch({ type: "GO_TO", screen: card.isMed ? "meditation" : "conv" });
  }

  return (
    <section className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(27,61,212,0.08),transparent_38%)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-48px)] max-w-7xl flex-col">
        <div className="relative flex items-start justify-center">
          <div className="pt-2 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#7B8FA8]">Listening · pick anything</p>
            <p className="mt-2 text-xl font-medium text-[#0F1B2D]">What calls to you?</p>
          </div>
          <div className="absolute right-0 top-0 hidden rounded-full border border-[#D5DCE6] bg-white px-3 py-1.5 text-xs text-[#5A6B82] sm:block">
            {visitedCount} of {cards.length} explored
          </div>
        </div>

        <div className="relative mx-auto mt-6 h-[620px] w-full max-w-6xl flex-1 sm:h-[600px]">
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <Sphere state="idle" size={120} />
          </div>

          {cards.map((card, index) => (
            <FloatingCard
              key={card.id}
              card={card}
              index={index}
              visited={state.visitedCardIds.includes(card.id)}
              onClick={() => openCard(card)}
            />
          ))}
        </div>

        <div className="relative z-20 flex justify-center pb-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => dispatch({ type: "GO_TO", screen: "end" })}
            className="h-11 rounded-full border border-[#D5DCE6] bg-transparent px-6 text-[#0F1B2D] transition-all hover:-translate-y-px hover:border-[#1B3DD4] hover:bg-white active:scale-[0.98]"
          >
            I&apos;m done exploring
          </Button>
        </div>
      </div>
    </section>
  );
}
