"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import Sphere from "@/components/Sphere";
import { Button } from "@/components/ui/button";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce } from "@/lib/journey-context";
import { markCompleted, updateSession } from "@/lib/tracking";
import { useAudio } from "@/lib/useAudio";

export default function Closing() {
  const { state } = useJourney();
  const t = useTranslations("journey.closing");
  const logSessionCompleted = useLogEventOnce(EVENTS.SESSION_COMPLETED);
  useAudio("/audio/closing.mp3");

  useEffect(() => {
    void logSessionCompleted();
    void markCompleted(state.sessionId);
    void updateSession(state.sessionId, { current_screen: "closing" });
  }, [logSessionCompleted, state.sessionId]);

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-5 py-8 text-center sm:px-8">
      <Sphere state="idle" size={160} />
      <h2 className="mt-10 text-2xl font-medium leading-tight text-[#0F1B2D] sm:text-[32px]">{t("title")}</h2>
      <p className="mt-4 max-w-xl text-[15px] leading-[1.65] text-[#5A6B82] sm:text-base">{t("body")}</p>
      <p className="mt-4 max-w-xl text-[15px] leading-[1.65] text-[#5A6B82] sm:text-base">{t("subtext")}</p>
      <Button
        type="button"
        onClick={() => window.open("#", "_blank", "noopener,noreferrer")}
        className="mt-10 h-12 rounded-full bg-[#1B3DD4] px-7 text-white transition-all hover:-translate-y-px hover:bg-[#1632B0] active:scale-[0.98]"
      >
        {t("cta")}
      </Button>
      <p className="mt-10 text-sm font-medium text-[#7B8FA8]">{t("footer")}</p>
    </section>
  );
}
