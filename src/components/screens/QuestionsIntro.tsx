"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Sphere from "@/components/Sphere";
import { Button } from "@/components/ui/button";
import { useJourney } from "@/lib/journey-context";
import { updateSession } from "@/lib/tracking";
import { useAudio } from "@/lib/useAudio";

const SPEAKING_DURATION_MS = 17_000;

export default function QuestionsIntro() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.questionsIntro");
  const [isSpeaking, setIsSpeaking] = useState(true);
  useAudio("/audio/questions-intro.mp3");

  useEffect(() => {
    void updateSession(state.sessionId, {
      current_screen: "questions_intro",
      status: "in_progress",
    });
  }, [state.sessionId]);

  useEffect(() => {
    setIsSpeaking(true);
    const timeoutId = setTimeout(() => {
      setIsSpeaking(false);
    }, SPEAKING_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, []);

  const sphereState = isSpeaking ? "speaking" : "idle";

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 text-center sm:px-8">
      <div className="m-auto flex flex-col items-center">
        <Sphere state={sphereState} size={200} />
        <div className="mt-8 w-full max-w-2xl rounded-3xl border border-[#E4E9F1] bg-white/70 px-5 py-6 shadow-[0_18px_55px_rgba(15,27,45,0.08)] sm:px-8">
          <p className="text-[18px] leading-[1.7] font-normal text-[#0F1B2D] sm:text-[20px]">
            {t("subtitle")}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => dispatch({ type: "GO_TO", screen: "board" })}
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-10 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98]"
        >
          {t("cta")}
        </Button>
      </div>
    </section>
  );
}
