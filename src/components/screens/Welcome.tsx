"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Sphere from "@/components/Sphere";
import { EVENTS } from "@/lib/events";
import { useJourney } from "@/lib/journey-context";
import { logEvent, updateSession } from "@/lib/tracking";

export default function Welcome() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.welcome");

  useEffect(() => {
    void updateSession(state.sessionId, { current_screen: "welcome" });
  }, [state.sessionId]);

  function startJourney() {
    void logEvent(state.sessionId, EVENTS.WELCOME_CTA_CLICKED);
    dispatch({ type: "GO_TO", screen: "meet_guide" });
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-5 py-8 text-center sm:px-8">
      <Sphere state="idle" size={160} />
      <h1 className="mt-10 text-[32px] leading-tight font-medium text-[#0F1B2D] sm:text-[40px]">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-[1.65] text-[#5A6B82] sm:text-base">
        {t("subtitle")}
      </p>

      <Button
        type="button"
        onClick={startJourney}
        className="mt-10 h-12 rounded-full bg-[#1B3DD4] px-7 text-white transition-all hover:-translate-y-px hover:bg-[#1632B0] active:scale-[0.98]"
      >
        {t("cta")}
      </Button>
    </section>
  );
}
