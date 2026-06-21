"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Sphere from "@/components/Sphere";
import { Button } from "@/components/ui/button";
import { useJourney } from "@/lib/journey-context";
import { getSectionSphereCircleColors } from "@/lib/section-sphere";
import { updateSession } from "@/lib/tracking";

const SPEAKING_DURATION_MS = 1_500;
const multicolorSphereCircleColors = getSectionSphereCircleColors(5);
const multicolorSphereCircleOpacities = [0.3, 0.3, 0.3, 0.3] as const;

import { AnimatedWordReveal } from "@/components/ui/animations/animated-word-reveal";
import {
  JourneyHero,
  JourneyScreen,
  journeyPrimaryButtonClassName,
} from "@/components/journey/screen-layout";
import { splitRevealWords } from "@/lib/text-reveal";

function getRevealDelay(index: number, totalWords: number) {
  if (totalWords <= 1) return 0;
  return (SPEAKING_DURATION_MS * index) / (totalWords - 1);
}

export default function PostMeditation() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.postMeditation");
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const subtitle = t("subtitle");
  const subtitleWords = useMemo(() => splitRevealWords(subtitle), [subtitle]);

  useEffect(() => {
    void updateSession(state.sessionId, { current_screen: "post_meditation" });
  }, [state.sessionId]);

  useEffect(() => {
    const resetTimeoutId = setTimeout(() => {
      setIsSpeaking(true);
      setVisibleWordCount(0);
    }, 0);

    const wordTimeoutIds = Array.from({ length: subtitleWords.length }, (_, index) =>
      setTimeout(() => {
        setVisibleWordCount((currentCount) => Math.max(currentCount, index + 1));
      }, getRevealDelay(index, subtitleWords.length))
    );

    const timeoutId = setTimeout(() => {
      setIsSpeaking(false);
    }, SPEAKING_DURATION_MS);

    return () => {
      clearTimeout(resetTimeoutId);
      wordTimeoutIds.forEach(clearTimeout);
      clearTimeout(timeoutId);
    };
  }, [subtitleWords.length]);

  return (
    <JourneyScreen>
      <JourneyHero>
        <Sphere
          state={isSpeaking ? "speaking" : "idle"}
          size={160}
          circleColors={multicolorSphereCircleColors}
          circleOpacities={multicolorSphereCircleOpacities}
        />
        <p
          className="max-w-md text-[20px] leading-[1.7] font-medium text-[#0F1B2D] sm:text-[23px]"
          aria-label={subtitle}
        >
          <AnimatedWordReveal text={subtitle} visibleWordCount={visibleWordCount} />
        </p>
        <Button
          type="button"
          onClick={() => dispatch({ type: "GO_TO", screen: "section_intro" })}
          disabled={isSpeaking}
          className={journeyPrimaryButtonClassName}
        >
          {t("cta")}
        </Button>
      </JourneyHero>
    </JourneyScreen>
  );
}
