"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Sphere from "@/components/Sphere";
import { Button } from "@/components/ui/button";
import { useJourney } from "@/lib/journey-context";
import { getSectionSphereCircleColors } from "@/lib/section-sphere";
import { updateSession } from "@/lib/tracking";

const SPEAKING_DURATION_MS = 2_000;
const multicolorSphereCircleColors = getSectionSphereCircleColors(5);
const multicolorSphereCircleOpacities = [0.3, 0.3, 0.3, 0.3] as const;

function splitWords(text: string) {
  return text.split(/\s+/).filter(Boolean);
}

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
  const subtitleWords = useMemo(() => splitWords(subtitle), [subtitle]);

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
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-5 py-8 text-center sm:px-8">
      <Sphere
        state={isSpeaking ? "speaking" : "idle"}
        size={160}
        circleColors={multicolorSphereCircleColors}
        circleOpacities={multicolorSphereCircleOpacities}
      />
      <p
        className="mt-10 max-w-md text-[20px] leading-[1.7] font-medium text-[#0F1B2D] sm:text-[23px]"
        aria-label={subtitle}
      >
        {subtitleWords.map((word, index) => (
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
            {index < subtitleWords.length - 1 ? " " : ""}
          </span>
        ))}
      </p>
      <Button
        type="button"
        onClick={() => dispatch({ type: "GO_TO", screen: "section_intro" })}
        disabled={isSpeaking}
        className="bg-primary text-primary-foreground hover:bg-primary/90 mt-10 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98] disabled:cursor-not-allowed"
      >
        {t("cta")}
      </Button>
    </section>
  );
}
