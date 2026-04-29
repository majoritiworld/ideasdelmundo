"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { EVENTS } from "@/lib/events";
import { useJourney } from "@/lib/journey-context";
import { useAudio } from "@/lib/useAudio";
import { logEvent, updateSession } from "@/lib/tracking";

const COUNTDOWN_MS = 3_000;
const PREPARE_MS = 3_000;
const INHALE_MS = 4_000;
const HOLD_MS = 2_000;
const EXHALE_MS = 6_000;
const CYCLE_MS = INHALE_MS + HOLD_MS + EXHALE_MS;
const TOTAL_CYCLES = 5;
const STARTUP_MS = PREPARE_MS + COUNTDOWN_MS;
const TOTAL_MS = STARTUP_MS + CYCLE_MS * TOTAL_CYCLES;
const TICK_MS = 100;

type BreathPhase = "inhale" | "hold" | "exhale";
type CirclePhase = BreathPhase | "prepare" | "countdown" | "ready" | "complete";

function easeInOutSine(progress: number) {
  return -(Math.cos(Math.PI * progress) - 1) / 2;
}

function getBreathingState(elapsedMs: number): {
  cueKey: BreathPhase;
  cycle: number;
  phaseElapsedMs: number;
} {
  const cycleElapsed = elapsedMs % CYCLE_MS;
  const cycle = Math.min(TOTAL_CYCLES, Math.floor(elapsedMs / CYCLE_MS) + 1);

  if (cycleElapsed < INHALE_MS) {
    return {
      cueKey: "inhale",
      cycle,
      phaseElapsedMs: cycleElapsed,
    };
  }

  if (cycleElapsed < INHALE_MS + HOLD_MS) {
    return { cueKey: "hold", cycle, phaseElapsedMs: cycleElapsed - INHALE_MS };
  }

  return {
    cueKey: "exhale",
    cycle,
    phaseElapsedMs: cycleElapsed - INHALE_MS - HOLD_MS,
  };
}

function getGradientProgress(phase: CirclePhase, phaseElapsedMs: number) {
  if (phase === "inhale") {
    return easeInOutSine(Math.min(1, phaseElapsedMs / INHALE_MS));
  }

  if (phase === "hold") {
    return 1;
  }

  if (phase === "exhale") {
    return easeInOutSine(Math.max(0, 1 - phaseElapsedMs / EXHALE_MS));
  }

  return 0;
}

function BreathingCircle({
  phase,
  gradientProgress,
}: {
  phase: CirclePhase;
  gradientProgress: number;
}) {
  const circleStyle = {
    "--breath-scale": 0.18 + gradientProgress * 0.84,
    "--breath-opacity": phase === "ready" || phase === "complete" ? 0 : 1,
  } as CSSProperties;

  return (
    <div
      className={`relative flex size-[230px] items-center justify-center overflow-hidden rounded-full border-[6px] border-[#9F77DD] bg-transparent sm:size-[260px] ${
        phase === "ready" ? "animate-[meditation-ready-breathe_4s_ease-in-out_infinite]" : ""
      }`}
      style={circleStyle}
      aria-live="polite"
    >
      <div className="absolute inset-0 rounded-full border border-[#9F77DD] bg-[#9F77DD] opacity-[var(--breath-opacity)] transition-[transform,opacity] duration-100 ease-linear [transform:scale(var(--breath-scale))]" />
      <style jsx>{`
        @keyframes meditation-ready-breathe {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.035);
          }
        }
      `}</style>
    </div>
  );
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
  const isPrepare = started && !completed && elapsedMs < PREPARE_MS;
  const isCountdown = started && !completed && elapsedMs >= PREPARE_MS && elapsedMs < STARTUP_MS;
  const exerciseElapsedMs = Math.max(0, elapsedMs - STARTUP_MS);
  const breathingState = getBreathingState(
    Math.min(exerciseElapsedMs, CYCLE_MS * TOTAL_CYCLES - 1)
  );
  const countdownCount = Math.max(1, Math.ceil((STARTUP_MS - elapsedMs) / 1_000));
  const circlePhase: CirclePhase = completed
    ? "complete"
    : isPrepare
      ? "prepare"
      : isCountdown
        ? "countdown"
        : started
          ? breathingState.cueKey
          : "ready";
  const mainLabel = completed
    ? t("complete")
    : isPrepare
      ? t("prepareToInhale")
      : isCountdown
        ? String(countdownCount)
        : started
          ? t(`cues.${breathingState.cueKey}`)
          : t("ready");
  const gradientProgress = getGradientProgress(circlePhase, breathingState.phaseElapsedMs);

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
    dispatch({ type: "GO_TO", screen: "post_meditation" });
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

  function finishMeditation() {
    completedLogged.current = true;
    setCompleted(true);
    dispatch({ type: "SET_MEDITATION_COMPLETED", completed: true });
    void logEvent(state.sessionId, EVENTS.MEDITATION_COMPLETED);
    void updateSession(state.sessionId, { meditation_completed: true });
    dispatch({ type: "GO_TO", screen: "post_meditation" });
  }

  return (
    <section className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 text-center sm:px-8">
      <div className="m-auto flex flex-col items-center pt-16">
        <BreathingCircle phase={circlePhase} gradientProgress={gradientProgress} />
        <p className="mt-10 max-w-[520px] text-[26px] leading-[1.25] font-medium text-[#0F1B2D]">
          {mainLabel}
        </p>
        <p className="mt-4 text-[20px] leading-[1.65] text-[#5A6B82]">
          {started && !isPrepare && !isCountdown
            ? t("cycle", {
                current: Math.min(breathingState.cycle, TOTAL_CYCLES),
                total: TOTAL_CYCLES,
              })
            : isPrepare || isCountdown
              ? t("countdownInstruction")
              : t("instruction")}
        </p>
        {!started ? (
          <div className="mt-10 flex items-center justify-center gap-3">
            <Button
              type="button"
              onClick={startBreathing}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98]"
            >
              {t("start")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={skipMeditation}
              className="hover:border-primary hover:text-primary h-12 rounded-full border border-[#D5DCE6] bg-[#F1F3F6] px-7 text-[#5A6B82] hover:bg-white"
            >
              {t("skip")}
            </Button>
          </div>
        ) : null}
        {completed ? (
          <Button
            type="button"
            onClick={() => dispatch({ type: "GO_TO", screen: "post_meditation" })}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-10 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98]"
          >
            {t("continue")}
          </Button>
        ) : null}
      </div>
      {started && !completed ? (
        <button
          type="button"
          onClick={finishMeditation}
          className="focus-visible:ring-ring absolute bottom-5 left-1/2 -translate-x-1/2 cursor-pointer bg-transparent text-sm font-medium text-[#8A97A8] underline underline-offset-4 transition-colors hover:text-[#5A6B82] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:bottom-8"
        >
          {t("finishSession")}
        </button>
      ) : null}
    </section>
  );
}
