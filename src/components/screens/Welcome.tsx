"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import ProgressDots from "@/components/ui/ProgressDots";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce } from "@/lib/journey-context";
import { logEvent, updateSession } from "@/lib/tracking";

export default function Welcome() {
  const { state, dispatch } = useJourney();
  const logIntroVideoPlayed = useLogEventOnce(EVENTS.INTRO_VIDEO_PLAYED);

  useEffect(() => {
    void updateSession(state.sessionId, { current_screen: "welcome" });
  }, [state.sessionId]);

  function startJourney() {
    void logEvent(state.sessionId, EVENTS.WELCOME_CTA_CLICKED);
    dispatch({ type: "GO_TO", screen: "intake" });
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 text-center sm:px-8">
      <div className="m-auto flex w-full max-w-3xl flex-col items-center">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-[#7B8FA8]">A gift from majoriti</p>
        <h1 className="text-[32px] font-medium leading-tight text-[#0F1B2D]">Find clarity. Find your why.</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-[1.65] text-[#5A6B82] sm:text-base">
          A guided voice experience to help you reconnect with your purpose and how it fits into your work.
        </p>

        <div className="relative mt-10 aspect-video w-full overflow-hidden rounded-2xl bg-[#0F1B2D]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(111,163,255,0.18),transparent_52%)]" />
          <button
            type="button"
            aria-label="play intro"
            onClick={() => void logIntroVideoPlayed()}
            className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[#1B3DD4] transition-transform active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="ml-1 size-7" aria-hidden>
              <path d="M8 5.2v13.6L18.5 12z" fill="currentColor" />
            </svg>
          </button>
          <span className="absolute bottom-4 left-4 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 backdrop-blur">
            Intro from Sebastián · 1:42
          </span>
        </div>

        <Button
          type="button"
          onClick={startJourney}
          className="mt-10 h-12 rounded-full bg-[#1B3DD4] px-7 text-white transition-all hover:-translate-y-px hover:bg-[#1632B0] active:scale-[0.98]"
        >
          I&apos;m ready to begin
        </Button>
      </div>
      <ProgressDots activeIndex={0} />
    </section>
  );
}
