"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sphere from "@/components/Sphere";
import { EVENTS } from "@/lib/events";
import { useJourney } from "@/lib/journey-context";
import {
  getSectionSphereCircleColors,
  getSectionSphereCircleOpacities,
} from "@/lib/section-sphere";
import { createSession, logEvent, updateSession } from "@/lib/tracking";

const multicolorSphereCircleColors = getSectionSphereCircleColors(5);
const multicolorSphereCircleOpacities = getSectionSphereCircleOpacities(5);

export default function Welcome() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.welcome");
  const [name, setName] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const nameReady = name.trim().length > 0;

  useEffect(() => {
    void updateSession(state.sessionId, { current_screen: "welcome" });
  }, [state.sessionId]);

  async function ensureSession() {
    if (state.sessionId) return state.sessionId;

    const id = await createSession(
      {
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      },
      state.userId
    );

    if (id) {
      dispatch({ type: "SET_SESSION_ID", id });
      void logEvent(id, EVENTS.SESSION_STARTED);
    }

    return id;
  }

  async function startJourney() {
    if (!name.trim() || isStarting) return;
    setIsStarting(true);

    const sessionId = await ensureSession();
    void logEvent(sessionId, EVENTS.WELCOME_CTA_CLICKED);
    void updateSession(sessionId, { name: name.trim() });
    dispatch({ type: "SET_NAME", name: name.trim() });
    dispatch({ type: "GO_TO", screen: "meet_guide" });
    setIsStarting(false);
  }

  function resumeJourney() {
    if (!state.resumeSession) return;
    dispatch({ type: "HYDRATE_RESUME", session: state.resumeSession });
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-5 py-8 text-center sm:px-8">
      <Sphere
        state="idle"
        size={160}
        circleColors={multicolorSphereCircleColors}
        circleOpacities={multicolorSphereCircleOpacities}
      />
      <h1 className="font-heading mt-10 text-[32px] leading-tight font-medium text-[#0F1B2D] sm:text-[40px]">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-[1.65] text-[#5A6B82] sm:text-[20px]">
        {t("subtitleLine1")}
        <br />
        {t("subtitleLine2")}
      </p>

      <div className="mt-8 w-full max-w-xl text-center">
        <label htmlFor="welcome-name" className="text-base font-light text-[#5A6B82]">
          {t("nameLabel")}
        </label>

        <div className="mt-3 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Input
            id="welcome-name"
            name="name"
            type="text"
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            className="h-auto border-[#D5DCE6] py-3 pr-5 pl-5 text-start text-[18px] text-[#0F1B2D] shadow-none sm:basis-[49%]"
            aria-required
          />
          <Button
            type="button"
            onClick={() => void startJourney()}
            disabled={!nameReady || isStarting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98] disabled:cursor-not-allowed"
          >
            {t("cta")}
          </Button>
        </div>
        {state.resumeSession ? (
          <Button
            type="button"
            variant="outline"
            onClick={resumeJourney}
            className="mt-4 h-12 rounded-full border-[#D5DCE6] bg-white px-7 text-[#5A6B82] transition-all hover:-translate-y-px hover:bg-white hover:text-[#0F1B2D] active:scale-[0.98]"
          >
            {t("resumeCta")}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
