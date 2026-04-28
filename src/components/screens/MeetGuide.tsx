"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Sphere from "@/components/Sphere";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce } from "@/lib/journey-context";
import { useAudio } from "@/lib/useAudio";
import { updateSession } from "@/lib/tracking";

const WORD_MS = 110;
const PHRASE_PAUSE_MS = 600;
const CTA_DELAY_MS = 800;

const PHRASE_2 =
  "I'm Dave, and I'll be your guide in this experience. I'm here to help you explore your purpose and connect it with your work.";
const PHRASE_3 =
  "Together we'll discover what moves you, what gives you energy, and how you can contribute to the world in your own unique way.";

export default function MeetGuide() {
  const { state, dispatch } = useJourney();
  const logMeetGuideViewed = useLogEventOnce(EVENTS.MEET_GUIDE_VIEWED);
  const [visibleCount, setVisibleCount] = useState(0);
  const [showCta, setShowCta] = useState(false);
  useAudio("/audio/welcome.mp3");

  const phrase1 = state.name ? `Welcome, ${state.name}!` : "Welcome!";
  const phrases = useMemo(
    () => [phrase1, PHRASE_2, PHRASE_3] as const,
    [phrase1]
  );
  const words = useMemo(() => phrases.flatMap((p) => p.split(" ")), [phrases]);

  useEffect(() => {
    void logMeetGuideViewed();
    void updateSession(state.sessionId, { current_screen: "meet_guide" });
  }, [logMeetGuideViewed, state.sessionId]);

  useEffect(() => {
    setVisibleCount(0);
    setShowCta(false);
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];
    let t = 0;
    let k = 0;
    let lastWordTime = 0;

    phrases.forEach((phrase, pIdx) => {
      const chunk = phrase.split(" ");
      chunk.forEach(() => {
        const at = t;
        const n = k;
        const id = setTimeout(() => {
          setVisibleCount(n + 1);
        }, at);
        timeoutIds.push(id);
        lastWordTime = at;
        t += WORD_MS;
        k += 1;
      });
      if (pIdx < phrases.length - 1) {
        t += PHRASE_PAUSE_MS - WORD_MS;
      }
    });

    const ctaId = setTimeout(
      () => {
        setShowCta(true);
      },
      lastWordTime + CTA_DELAY_MS
    );
    timeoutIds.push(ctaId);

    return () => {
      for (const id of timeoutIds) {
        clearTimeout(id);
      }
    };
  }, [phrases]);

  const sphereState = visibleCount >= words.length ? "idle" : "speaking";

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 text-center sm:px-8">
      <div className="m-auto flex flex-col items-center">
        <Sphere state={sphereState} size={200} />
        <p className="mt-6 text-xs font-medium text-[#7B8FA8]">Speaking</p>
        <div className="mt-8 w-full max-w-2xl rounded-3xl border border-[#E4E9F1] bg-white/70 px-5 py-6 shadow-[0_18px_55px_rgba(15,27,45,0.08)] sm:px-8">
          <p className="text-[18px] leading-[1.7] font-normal text-[#0F1B2D] sm:text-[20px]">
            {words.map((word, i) => (
              <span
                key={i}
                className="transition-opacity duration-300"
                style={{ opacity: i < visibleCount ? 1 : 0 }}
              >
                {word}
                {i < words.length - 1 ? " " : ""}
              </span>
            ))}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => dispatch({ type: "GO_TO", screen: "breathing_offer" })}
          className="mt-10 h-12 rounded-full bg-primary px-7 text-primary-foreground transition-all hover:-translate-y-px hover:bg-primary/90 active:scale-[0.98]"
          style={{
            opacity: showCta ? 1 : 0,
            pointerEvents: showCta ? "auto" : "none",
            transition: "opacity 1200ms ease",
          }}
        >
          Start the experience
        </Button>
      </div>
    </section>
  );
}