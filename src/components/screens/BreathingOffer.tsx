"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Sphere from "@/components/Sphere";
import { Button } from "@/components/ui/button";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce } from "@/lib/journey-context";
import { getSectionSphereCircleColors } from "@/lib/section-sphere";
import { logEvent, updateSession } from "@/lib/tracking";

const SPEAKING_DURATION_MS = 4_000;
const multicolorSphereCircleColors = getSectionSphereCircleColors(5);
const multicolorSphereCircleOpacities = [0.3, 0.3, 0.3, 0.3] as const;

function splitWords(text: string) {
  return text.split(/\s+/).filter(Boolean);
}

function getRevealDelay(index: number, totalWords: number) {
  if (totalWords <= 1) return 0;
  return (SPEAKING_DURATION_MS * index) / (totalWords - 1);
}

export default function BreathingOffer() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.breathingOffer");
  const logBreathingOffered = useLogEventOnce(EVENTS.BREATHING_OFFERED);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const title = t("title");
  const subtitle = t("subtitle");
  const titleWords = useMemo(() => splitWords(title), [title]);
  const subtitleWords = useMemo(() => splitWords(subtitle), [subtitle]);
  const totalWordCount = titleWords.length + subtitleWords.length;

  useEffect(() => {
    void logBreathingOffered();
    void updateSession(state.sessionId, { current_screen: "breathing_offer" });
  }, [logBreathingOffered, state.sessionId]);

  useEffect(() => {
    const resetTimeoutId = setTimeout(() => {
      setIsSpeaking(true);
      setVisibleWordCount(0);
    }, 0);

    const wordTimeoutIds = Array.from({ length: totalWordCount }, (_, index) =>
      setTimeout(() => {
        setVisibleWordCount((currentCount) => Math.max(currentCount, index + 1));
      }, getRevealDelay(index, totalWordCount))
    );

    const timeoutId = setTimeout(() => {
      setIsSpeaking(false);
    }, SPEAKING_DURATION_MS);

    return () => {
      clearTimeout(resetTimeoutId);
      wordTimeoutIds.forEach(clearTimeout);
      clearTimeout(timeoutId);
    };
  }, [totalWordCount]);

  function startMeditation() {
    dispatch({ type: "GO_TO", screen: "meditation" });
  }

  function skipMeditation() {
    void logEvent(state.sessionId, EVENTS.MEDITATION_SKIPPED);
    dispatch({ type: "GO_TO", screen: "section_intro" });
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-5 py-8 text-center sm:px-8">
      <Sphere
        state={isSpeaking ? "speaking" : "idle"}
        size={140}
        circleColors={multicolorSphereCircleColors}
        circleOpacities={multicolorSphereCircleOpacities}
      />
      <h2
        className="mt-10 text-2xl leading-tight font-medium text-[#0F1B2D] sm:text-[32px]"
        aria-label={title}
      >
        {titleWords.map((word, index) => (
          <span
            key={`${word}-${index}`}
            aria-hidden="true"
            className={
              index < visibleWordCount
                ? "opacity-100 transition-opacity duration-300"
                : "opacity-0 transition-opacity duration-300"
            }
          >
            {word}
            {index < titleWords.length - 1 ? " " : ""}
          </span>
        ))}
      </h2>
      <p
        className="mt-4 max-w-xl text-[15px] leading-[1.65] text-[#5A6B82] sm:text-[20px]"
        aria-label={subtitle}
      >
        {subtitleWords.map((word, index) => {
          const revealIndex = titleWords.length + index;

          return (
            <span
              key={`${word}-${index}`}
              aria-hidden="true"
              className={
                revealIndex < visibleWordCount
                  ? "opacity-100 transition-opacity duration-300"
                  : "opacity-0 transition-opacity duration-300"
              }
            >
              {word}
              {index < subtitleWords.length - 1 ? " " : ""}
            </span>
          );
        })}
      </p>
      <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          type="button"
          onClick={startMeditation}
          disabled={isSpeaking}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98] disabled:cursor-not-allowed"
        >
          {t("yes")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={skipMeditation}
          disabled={isSpeaking}
          className="hover:border-primary h-12 rounded-full border border-[#D5DCE6] bg-transparent px-7 text-[#0F1B2D] transition-all hover:-translate-y-px hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed"
        >
          {t("skip")}
        </Button>
      </div>
    </section>
  );
}
