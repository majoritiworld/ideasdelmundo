"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Sphere from "@/components/Sphere";
import { EVENTS } from "@/lib/events";
import { useJourney } from "@/lib/journey-context";
import { useAudio } from "@/lib/useAudio";
import { logEvent, updateSession } from "@/lib/tracking";

const INHALE_MS = 6_000;
const HOLD_MS = 4_000;
const EXHALE_MS = 6_000;
const REST_MS = 2_000;
const CYCLE_MS = INHALE_MS + HOLD_MS + EXHALE_MS + REST_MS;
const TOTAL_CYCLES = 3;
const TOTAL_MS = CYCLE_MS * TOTAL_CYCLES;
const TICK_MS = 100;

function getBreathingState(elapsedMs: number) {
  const cycleElapsed = elapsedMs % CYCLE_MS;
  const cycle = Math.min(TOTAL_CYCLES, Math.floor(elapsedMs / CYCLE_MS) + 1);

  if (cycleElapsed < INHALE_MS) {
    return {
      cueKey: "inhale",
      cycle,
      scale: 1 + (cycleElapsed / INHALE_MS) * 0.18,
    };
  }

  if (cycleElapsed < INHALE_MS + HOLD_MS) {
    return { cueKey: "hold", cycle, scale: 1.18 };
  }

  if (cycleElapsed < INHALE_MS + HOLD_MS + EXHALE_MS) {
    const phaseElapsed = cycleElapsed - INHALE_MS - HOLD_MS;
    return {
      cueKey: "exhale",
      cycle,
      scale: 1.18 - (phaseElapsed / EXHALE_MS) * 0.18,
    };
  }

  return { cueKey: "rest", cycle, scale: 1 };
}

export default function Meditation() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.meditation");
  const [started, setStarted] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [completed, setCompleted] = useState(false);
  const startedAt = useRef<number>(0);
  const completedLogged = useRef(false);
  useAudio("/audio/meditation-music.mp3", { loop: true });
  const breathingState = getBreathingState(Math.min(elapsedMs, TOTAL_MS - 1));

  useEffect(() => {
    void updateSession(state.sessionId, { current_screen: "meditation" });
  }, [state.sessionId]);

  useEffect(() => {
    if (!started || completed) return;

    const interval = window.setInterval(() => {
      const nextElapsed = Date.now() - startedAt.current;
      setElapsedMs(nextElapsed);

      if (nextElapsed >= TOTAL_MS) {
        window.clearInterval(interval);
        setCompleted(true);
      }
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, [completed, started]);

  useEffect(() => {
    if (!completed || completedLogged.current) return;
    completedLogged.current = true;
    dispatch({ type: "SET_MEDITATION_COMPLETED", completed: true });
    void logEvent(state.sessionId, EVENTS.MEDITATION_COMPLETED);
    void updateSession(state.sessionId, { meditation_completed: true });
  }, [completed, dispatch, state.sessionId]);

  function startBreathing() {
    startedAt.current = Date.now();
    setStarted(true);
    setElapsedMs(0);
    void logEvent(state.sessionId, EVENTS.MEDITATION_STARTED);
  }

  function skipMeditation() {
    void logEvent(state.sessionId, EVENTS.MEDITATION_SKIPPED);
    dispatch({ type: "GO_TO", screen: "questions_intro" });
  }

  return (
    <section className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 text-center sm:px-8">
      <Button
        type="button"
        variant="ghost"
        onClick={skipMeditation}
        className="absolute bottom-5 right-5 h-10 rounded-full border border-[#D5DCE6] bg-transparent px-5 text-[#5A6B82] hover:border-[#1B3DD4] hover:bg-white hover:text-[#1B3DD4] sm:bottom-8 sm:right-8"
      >
        {t("skip")}
      </Button>

      <div className="m-auto flex flex-col items-center pt-16">
        <div style={{ transform: `scale(${started && !completed ? breathingState.scale : 1})` }}>
          <Sphere state="idle" variant="green" size={200} className="breathing-override" />
        </div>
        <p className="mt-10 text-xl font-medium text-[#0F1B2D]">{started ? t(`cues.${breathingState.cueKey}`) : t("ready")}</p>
        <p className="mt-4 text-[15px] leading-[1.65] text-[#5A6B82]">
          {started ? t("cycle", { current: Math.min(breathingState.cycle, TOTAL_CYCLES), total: TOTAL_CYCLES }) : t("instruction")}
        </p>
        {!started ? (
          <Button
            type="button"
            onClick={startBreathing}
            className="mt-10 h-12 rounded-full bg-[#1B3DD4] px-7 text-white transition-all hover:-translate-y-px hover:bg-[#1632B0] active:scale-[0.98]"
          >
            {t("start")}
          </Button>
        ) : null}
        {completed ? (
          <Button
            type="button"
            onClick={() => dispatch({ type: "GO_TO", screen: "post_meditation" })}
            className="mt-10 h-12 rounded-full bg-[#1B3DD4] px-7 text-white transition-all hover:-translate-y-px hover:bg-[#1632B0] active:scale-[0.98]"
          >
            {t("continue")}
          </Button>
        ) : null}
      </div>

      <style jsx global>{`
        .majoriti-sphere.breathing-override {
          animation: none !important;
        }
      `}</style>
    </section>
  );
}
