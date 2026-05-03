"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Sphere from "@/components/Sphere";
import { Button } from "@/components/ui/button";
import { useJourney } from "@/lib/journey-context";
import { updateSession } from "@/lib/tracking";
import { useAudio } from "@/lib/useAudio";

const SPEAKING_DURATION_MS = 4_000;

export default function PostMeditation() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.postMeditation");
  const [isSpeaking, setIsSpeaking] = useState(true);
  useAudio("/audio/post-meditation.mp3");

  useEffect(() => {
    void updateSession(state.sessionId, { current_screen: "post_meditation" });
  }, [state.sessionId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsSpeaking(false);
    }, SPEAKING_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-5 py-8 text-center sm:px-8">
      <Sphere state={isSpeaking ? "speaking" : "idle"} variant="green" size={160} />
      <p className="mt-10 max-w-md text-[20px] leading-[1.7] font-medium text-[#0F1B2D] sm:text-[23px]">
        {t("subtitle")}
      </p>
      <Button
        type="button"
        onClick={() => dispatch({ type: "GO_TO", screen: "section_intro" })}
        className="bg-primary text-primary-foreground hover:bg-primary/90 mt-10 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98]"
      >
        {t("cta")}
      </Button>
    </section>
  );
}
