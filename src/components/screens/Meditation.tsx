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
const INHALE_MS = 4_500;
const HOLD_MS = 0;
const EXHALE_MS = 5_500;
const CYCLE_MS = INHALE_MS + HOLD_MS + EXHALE_MS;
const TOTAL_CYCLES = 5;
const STARTUP_MS = PREPARE_MS + COUNTDOWN_MS;
const TOTAL_MS = STARTUP_MS + CYCLE_MS * TOTAL_CYCLES;
const TICK_MS = 100;
const INTRO_SPEAKING_MS = 5_500;
const INTRO_SPHERE_SIZE = 208;
const INTRO_SPHERE_SCALE = 1.25;
const INTRO_ALIGNMENT_MS = 5_000;

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
  opacityProgress,
}: {
  phase: CirclePhase;
  gradientProgress: number;
  opacityProgress: number;
}) {
  const circleOpacity = phase === "ready" || phase === "complete" ? 0 : 0.3 + opacityProgress * 0.7;
  const circleStyle = {
    "--breath-scale": 0.18 + gradientProgress * 0.84,
    "--breath-opacity": circleOpacity,
    borderColor: `rgba(159, 119, 221, ${circleOpacity})`,
  } as CSSProperties;

  return (
    <div
      className={`relative flex size-[230px] items-center justify-center overflow-hidden rounded-full border-[6px] bg-transparent sm:size-[260px] ${
        phase === "ready" ? "animate-[meditation-ready-breathe_4s_ease-in-out_infinite]" : ""
      } animate-[meditation-circle-fade-in_700ms_ease-out_both]`}
      style={circleStyle}
      aria-live="polite"
    >
      <div className="absolute inset-0 [transform:scale(var(--breath-scale))] rounded-full border border-[#9F77DD] bg-[#9F77DD] opacity-[var(--breath-opacity)] transition-[transform,opacity] duration-100 ease-linear" />
      <style jsx>{`
        @keyframes meditation-circle-fade-in {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

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

function MeditationIntroSphere({
  isSpeaking,
  alignOnIntro = true,
}: {
  isSpeaking: boolean;
  alignOnIntro?: boolean;
}) {
  const [hasStartedAlignment, setHasStartedAlignment] = useState(false);
  const sphereStyle = {
    width: INTRO_SPHERE_SIZE * INTRO_SPHERE_SCALE,
    height: INTRO_SPHERE_SIZE * INTRO_SPHERE_SCALE,
    "--meditation-intro-duration": `${INTRO_ALIGNMENT_MS}ms`,
  } as CSSProperties;
  const isAligned = alignOnIntro && (!isSpeaking || hasStartedAlignment);

  useEffect(() => {
    if (!alignOnIntro) {
      return;
    }

    if (!isSpeaking) {
      const frame = window.requestAnimationFrame(() => {
        setHasStartedAlignment(true);
      });

      return () => window.cancelAnimationFrame(frame);
    }

    let secondFrame: number | null = null;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setHasStartedAlignment(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);

      if (secondFrame) {
        window.cancelAnimationFrame(secondFrame);
      }
    };
  }, [alignOnIntro, isSpeaking]);

  return (
    <div
      aria-label="meditation guide sphere"
      className={`meditation-intro-sphere ${
        isAligned ? "meditation-intro-sphere--aligned" : "meditation-intro-sphere--ikigai"
      }`}
      style={sphereStyle}
    >
      <div className="meditation-intro-sphere__circle meditation-intro-sphere__circle--1" />
      <div className="meditation-intro-sphere__circle meditation-intro-sphere__circle--2" />
      <div className="meditation-intro-sphere__circle meditation-intro-sphere__circle--3" />
      <div className="meditation-intro-sphere__circle meditation-intro-sphere__circle--4" />
      <style jsx>{`
        .meditation-intro-sphere {
          position: relative;
          color: #9f77dd;
          transform-origin: center;
          animation: meditation-intro-sphere-fade-in 700ms ease-out both;
        }

        .meditation-intro-sphere__circle {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 70%;
          height: 70%;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.3;
          transform-origin: center;
          will-change: transform;
        }

        .meditation-intro-sphere__circle--1 {
          transform: translateX(-50%) translateY(-71.5%);
        }

        .meditation-intro-sphere__circle--2 {
          transform: translateX(-50%) translateY(-28.5%);
        }

        .meditation-intro-sphere__circle--3 {
          transform: translateX(-71.5%) translateY(-50%);
        }

        .meditation-intro-sphere__circle--4 {
          transform: translateX(-28.5%) translateY(-50%);
        }

        .meditation-intro-sphere--aligned .meditation-intro-sphere__circle {
          transition: transform var(--meditation-intro-duration) cubic-bezier(0.22, 1, 0.36, 1);
        }

        .meditation-intro-sphere--aligned .meditation-intro-sphere__circle--1 {
          transform: translateX(-50%) translateY(-71.5%);
        }

        .meditation-intro-sphere--aligned .meditation-intro-sphere__circle--2 {
          transform: translateX(-50%) translateY(-57%);
        }

        .meditation-intro-sphere--aligned .meditation-intro-sphere__circle--3 {
          transform: translateX(-50%) translateY(-42.5%);
        }

        .meditation-intro-sphere--aligned .meditation-intro-sphere__circle--4 {
          transform: translateX(-50%) translateY(-28.5%);
        }

        @keyframes meditation-intro-sphere-fade-in {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
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
  const [isIntroSpeaking, setIsIntroSpeaking] = useState(true);
  const startedAt = useRef<number>(0);
  const completedLogged = useRef(false);
  useAudio("/audio/meditation.mp3");
  useAudio("/audio/meditation-music.mp3", {
    enabled: started && !completed && elapsedMs >= STARTUP_MS,
    loop: true,
  });
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
  const opacityProgress = started
    ? Math.min(1, Math.max(0, exerciseElapsedMs / (CYCLE_MS * TOTAL_CYCLES)))
    : 0;

  useEffect(() => {
    void updateSession(state.sessionId, { current_screen: "meditation" });
  }, [state.sessionId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsIntroSpeaking(false);
    }, INTRO_SPEAKING_MS);

    return () => clearTimeout(timeoutId);
  }, []);

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
    dispatch({ type: "GO_TO", screen: "section_intro" });
  }

  function finishMeditation() {
    setCompleted(true);
  }

  function repeatMeditation() {
    completedLogged.current = false;
    startedAt.current = Date.now();
    setStarted(true);
    setCompleted(false);
    setElapsedMs(0);
    void logEvent(state.sessionId, EVENTS.MEDITATION_STARTED);
  }

  function goToPostMeditation() {
    dispatch({ type: "GO_TO", screen: "post_meditation" });
  }

  return (
    <section className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 text-center sm:px-8">
      <div className="m-auto flex flex-col items-center pt-16">
        {completed ? (
          <MeditationIntroSphere isSpeaking={false} alignOnIntro={false} />
        ) : started ? (
          <BreathingCircle
            phase={circlePhase}
            gradientProgress={gradientProgress}
            opacityProgress={opacityProgress}
          />
        ) : (
          <MeditationIntroSphere isSpeaking={isIntroSpeaking} />
        )}
        <p className="mt-10 max-w-[520px] text-[26px] leading-[1.25] font-medium text-[#0F1B2D]">
          {mainLabel}
        </p>
        <p className="mt-4 text-[20px] leading-[1.65] text-[#5A6B82]">
          {completed
            ? null
            : started && !isPrepare && !isCountdown
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
          <div className="mt-10 flex items-center justify-center gap-3">
            <Button
              type="button"
              onClick={goToPostMeditation}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98]"
            >
              {t("done")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={repeatMeditation}
              className="hover:border-primary hover:text-primary h-12 rounded-full border border-[#D5DCE6] bg-[#F1F3F6] px-7 text-[#5A6B82] hover:bg-white"
            >
              {t("repeat")}
            </Button>
          </div>
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
