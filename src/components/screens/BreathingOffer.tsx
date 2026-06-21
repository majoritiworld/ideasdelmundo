"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Sphere from "@/components/Sphere";
import { Button } from "@/components/ui/button";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce } from "@/lib/journey-context";
import { getSectionSphereCircleColors } from "@/lib/section-sphere";
import { logEvent, updateSession } from "@/lib/tracking";

const SPEAKING_DURATION_MS = 3_000;
const multicolorSphereCircleColors = getSectionSphereCircleColors(5);
const multicolorSphereCircleOpacities = [0.3, 0.3, 0.3, 0.3] as const;

import { AnimatedWordReveal } from "@/components/ui/animations/animated-word-reveal";
import {
  JourneyActions,
  JourneyHero,
  JourneyScreen,
  journeyPrimaryButtonClassName,
} from "@/components/journey/screen-layout";
import { splitRevealWords } from "@/lib/text-reveal";

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
  const titleWords = useMemo(() => splitRevealWords(title), [title]);
  const subtitleWords = useMemo(() => splitRevealWords(subtitle), [subtitle]);
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
    <JourneyScreen>
      <JourneyHero>
        <Sphere
          state={isSpeaking ? "speaking" : "idle"}
          size={140}
          circleColors={multicolorSphereCircleColors}
          circleOpacities={multicolorSphereCircleOpacities}
        />
        <div className="flex flex-col gap-4">
          <h2
            className="text-2xl leading-tight font-medium text-[#0F1B2D] sm:text-[32px]"
            aria-label={title}
          >
            <AnimatedWordReveal text={title} visibleWordCount={visibleWordCount} />
          </h2>
          <p
            className="max-w-xl text-[15px] leading-[1.65] text-[#5A6B82] sm:text-[20px]"
            aria-label={subtitle}
          >
            <AnimatedWordReveal
              text={subtitle}
              visibleWordCount={visibleWordCount}
              wordIndexOffset={titleWords.length}
            />
          </p>
        </div>
      </JourneyHero>
      <JourneyActions className="mt-8 max-w-md">
        <Button
          type="button"
          onClick={startMeditation}
          disabled={isSpeaking}
          className={journeyPrimaryButtonClassName}
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
      </JourneyActions>
    </JourneyScreen>
  );
}
