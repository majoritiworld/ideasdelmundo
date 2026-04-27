"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import Sphere from "@/components/Sphere";
import { Button } from "@/components/ui/button";
import { useJourney } from "@/lib/journey-context";
import { updateSession } from "@/lib/tracking";
import { useAudio } from "@/lib/useAudio";

export default function QuestionsIntro() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.questionsIntro");
  useAudio("/audio/questions-intro.mp3");

  useEffect(() => {
    void updateSession(state.sessionId, {
      current_screen: "questions_intro",
      status: "in_progress",
    });
  }, [state.sessionId]);

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-5 py-8 text-center sm:px-8">
      <Sphere state="speaking" size={160} />
      <p className="mt-10 max-w-xl text-[18px] leading-[1.7] font-medium text-[#0F1B2D] sm:text-[21px]">
        {t("subtitle")}
      </p>
      <Button
        type="button"
        onClick={() => dispatch({ type: "GO_TO", screen: "board" })}
        className="mt-10 h-12 rounded-full bg-[#1B3DD4] px-7 text-white transition-all hover:-translate-y-px hover:bg-[#1632B0] active:scale-[0.98]"
      >
        {t("cta")}
      </Button>
    </section>
  );
}
