"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Sphere from "@/components/Sphere";
import { Button } from "@/components/ui/button";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce } from "@/lib/journey-context";
import { logEvent, updateSession } from "@/lib/tracking";
import { useAudio } from "@/lib/useAudio";

const SPEAKING_DURATION_MS = 6_000;

export default function BreathingOffer() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.breathingOffer");
  const logBreathingOffered = useLogEventOnce(EVENTS.BREATHING_OFFERED);
  const [isSpeaking, setIsSpeaking] = useState(true);
  useAudio("/audio/breathing-offer.mp3");

  useEffect(() => {
    void logBreathingOffered();
    void updateSession(state.sessionId, { current_screen: "breathing_offer" });
  }, [logBreathingOffered, state.sessionId]);

  useEffect(() => {
    setIsSpeaking(true);
    const timeoutId = setTimeout(() => {
      setIsSpeaking(false);
    }, SPEAKING_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, []);

  function startMeditation() {
    dispatch({ type: "GO_TO", screen: "meditation" });
  }

  function skipMeditation() {
    void logEvent(state.sessionId, EVENTS.MEDITATION_SKIPPED);
    dispatch({ type: "GO_TO", screen: "questions_intro" });
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-5 py-8 text-center sm:px-8">
      <Sphere state={isSpeaking ? "speaking" : "idle"} size={140} />
      <h2 className="mt-10 text-2xl leading-tight font-medium text-[#0F1B2D] sm:text-[32px]">
        {t("title")}
      </h2>
      <p className="mt-4 max-w-xl text-[15px] leading-[1.65] text-[#5A6B82] sm:text-[20px]">
        {t("subtitle")}
      </p>
      <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          type="button"
          onClick={startMeditation}
          className="h-12 rounded-full bg-primary px-7 text-primary-foreground transition-all hover:-translate-y-px hover:bg-primary/90 active:scale-[0.98]"
        >
          {t("yes")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={skipMeditation}
          className="h-12 rounded-full border border-[#D5DCE6] bg-transparent px-7 text-[#0F1B2D] transition-all hover:-translate-y-px hover:border-primary hover:bg-white active:scale-[0.98]"
        >
          {t("skip")}
        </Button>
      </div>
    </section>
  );
}
