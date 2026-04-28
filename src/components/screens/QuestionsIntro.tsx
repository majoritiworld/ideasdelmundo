"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Sphere from "@/components/Sphere";
import { Button } from "@/components/ui/button";
import { useJourney } from "@/lib/journey-context";
import { updateSession } from "@/lib/tracking";
import { useAudio } from "@/lib/useAudio";

const WORD_MS = 110;
const CTA_DELAY_MS = 800;

export default function QuestionsIntro() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.questionsIntro");
  const [visibleCount, setVisibleCount] = useState(0);
  const [showCta, setShowCta] = useState(false);
  useAudio("/audio/questions-intro.mp3");
  const words = useMemo(() => t("subtitle").split(" "), [t]);

  useEffect(() => {
    void updateSession(state.sessionId, {
      current_screen: "questions_intro",
      status: "in_progress",
    });
  }, [state.sessionId]);

  useEffect(() => {
    setVisibleCount(0);
    setShowCta(false);
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    words.forEach((_, index) => {
      const id = setTimeout(() => {
        setVisibleCount(index + 1);
      }, index * WORD_MS);
      timeoutIds.push(id);
    });

    const ctaId = setTimeout(
      () => {
        setShowCta(true);
      },
      Math.max(0, words.length - 1) * WORD_MS + CTA_DELAY_MS
    );
    timeoutIds.push(ctaId);

    return () => {
      for (const id of timeoutIds) {
        clearTimeout(id);
      }
    };
  }, [words]);

  const sphereState = visibleCount >= words.length ? "idle" : "speaking";

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 text-center sm:px-8">
      <div className="m-auto flex flex-col items-center">
        <Sphere state={sphereState} size={200} />
        <p className="mt-6 text-xs font-medium text-[#7B8FA8]">{t("stateLabel")}</p>
        <div className="mt-8 w-full max-w-2xl rounded-3xl border border-[#E4E9F1] bg-white/70 px-5 py-6 shadow-[0_18px_55px_rgba(15,27,45,0.08)] sm:px-8">
          <p className="text-[18px] leading-[1.7] font-normal text-[#0F1B2D] sm:text-[20px]">
            {words.map((word, index) => (
              <span
                key={index}
                className="transition-opacity duration-300"
                style={{ opacity: index < visibleCount ? 1 : 0 }}
              >
                {word}
                {index < words.length - 1 ? " " : ""}
              </span>
            ))}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => dispatch({ type: "GO_TO", screen: "board" })}
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-10 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98]"
          style={{
            opacity: showCta ? 1 : 0,
            pointerEvents: showCta ? "auto" : "none",
            transition: "opacity 1200ms ease",
          }}
        >
          {t("cta")}
        </Button>
      </div>
    </section>
  );
}
