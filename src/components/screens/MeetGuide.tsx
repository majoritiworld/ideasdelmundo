"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Sphere from "@/components/Sphere";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce } from "@/lib/journey-context";
import { useAudio } from "@/lib/useAudio";
import { updateSession } from "@/lib/tracking";

const CTA_DELAY_MS = 3_000;

export default function MeetGuide() {
  const { state, dispatch } = useJourney();
  const logMeetGuideViewed = useLogEventOnce(EVENTS.MEET_GUIDE_VIEWED);
  const t = useTranslations("journey.meetGuide");
  const [showCta, setShowCta] = useState(false);
  useAudio("/audio/welcome.mp3");

  useEffect(() => {
    void logMeetGuideViewed();
    void updateSession(state.sessionId, { current_screen: "meet_guide" });
  }, [logMeetGuideViewed, state.sessionId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setShowCta(true), CTA_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 text-center sm:px-8">
      <div className="m-auto flex flex-col items-center">
        <Sphere state="speaking" size={200} />
        <p className="mt-6 text-xs font-medium text-[#7B8FA8]">{t("stateLabel")}</p>
        <div className="mt-8 w-full max-w-2xl rounded-3xl border border-[#E4E9F1] bg-white/70 px-5 py-6 shadow-[0_18px_55px_rgba(15,27,45,0.08)] sm:px-8">
          <p className="text-[18px] font-medium leading-[1.7] text-[#0F1B2D] sm:text-[21px]">{t("subtitle")}</p>
        </div>
        {showCta ? (
          <Button
            type="button"
            onClick={() => dispatch({ type: "GO_TO", screen: "breathing_offer" })}
            className="mt-10 h-12 rounded-full bg-[#1B3DD4] px-7 text-white transition-all hover:-translate-y-px hover:bg-[#1632B0] active:scale-[0.98]"
          >
            {t("cta")}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
