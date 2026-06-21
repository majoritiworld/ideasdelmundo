"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import IkigaiFigure from "@/components/IkigaiFigure";
import {
  JourneyHero,
  JourneyScreen,
  JourneyScreenMain,
  journeyMaxForm,
  journeyPrimaryButtonClassName,
  journeyTightGap,
} from "@/components/journey/screen-layout";
import { EVENTS } from "@/lib/events";
import { useJourney } from "@/lib/journey-context";
import { createSession, logEvent, updateSession } from "@/lib/tracking";
import { cn } from "@/lib/utils";

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
      null
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
    if (!sessionId) {
      setIsStarting(false);
      return;
    }

    void logEvent(sessionId, EVENTS.WELCOME_CTA_CLICKED);
    void updateSession(sessionId, { name: name.trim() });
    dispatch({ type: "SET_NAME", name: name.trim() });
    dispatch({ type: "GO_TO", screen: "meet_guide" });
    setIsStarting(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void startJourney();
  }

  return (
    <JourneyScreen>
      <JourneyScreenMain>
        <JourneyHero>
          <div className="welcome-ikigai-listening">
            <IkigaiFigure size={160} />
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="font-['ArizonaFlare'] text-[38px] leading-tight font-medium text-[#0F1B2D] sm:text-[52px]">
              {t("title")}
            </h1>
            <p className="max-w-2xl text-[15px] leading-[1.65] text-[#5A6B82] sm:text-[20px]">
              {t("subtitleLine1")}
              <br />
              {t("subtitleLine2")}
            </p>
          </div>
        </JourneyHero>

        <div className={cn("w-full text-center", journeyMaxForm)}>
          <label htmlFor="welcome-name" className="text-[14px] font-light text-[#5A6B82]">
            {t("nameLabel")}
          </label>

          <form
            onSubmit={handleSubmit}
            className={cn("mt-4 flex w-full flex-col items-stretch", journeyTightGap)}
          >
            <Input
              id="welcome-name"
              name="name"
              type="text"
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="h-12 rounded-full border-[#D5DCE6] bg-white px-5 text-start text-[15px] text-[#0F1B2D] shadow-none"
              aria-required
            />
            <Button
              type="submit"
              disabled={!nameReady || isStarting}
              className={journeyPrimaryButtonClassName}
            >
              {t("cta")}
            </Button>
          </form>
        </div>
      </JourneyScreenMain>
      <style jsx>{`
        :global(.welcome-ikigai-listening) {
          animation: welcome-ikigai-listening-pulse 1.9s ease-in-out infinite;
          transform-origin: center;
          will-change: transform;
        }

        :global(.welcome-ikigai-listening svg circle) {
          animation: welcome-ikigai-listening-presence 1.9s ease-in-out infinite;
        }

        :global(.welcome-ikigai-listening svg circle:nth-of-type(2)) {
          animation-delay: -0.18s;
        }

        :global(.welcome-ikigai-listening svg circle:nth-of-type(3)) {
          animation-delay: -0.36s;
        }

        :global(.welcome-ikigai-listening svg circle:nth-of-type(4)) {
          animation-delay: -0.54s;
        }

        @keyframes welcome-ikigai-listening-pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.06);
          }
        }

        @keyframes welcome-ikigai-listening-presence {
          0%,
          100% {
            opacity: 0.28;
          }
          50% {
            opacity: 0.42;
          }
        }
      `}</style>
    </JourneyScreen>
  );
}
