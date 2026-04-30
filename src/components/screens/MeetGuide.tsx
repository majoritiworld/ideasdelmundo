"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Sphere from "@/components/Sphere";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce } from "@/lib/journey-context";
import { useAudio } from "@/lib/useAudio";
import { updateSession } from "@/lib/tracking";

const SPEAKING_DURATION_MS = 16_000;

const SENTENCE_2 = "I'm Emma, and I'll be your guide in this experience.";
const SENTENCE_3 =
  "I'm here to help you explore your purpose and connect it with your work.";
const SENTENCE_4 =
  "Together we'll discover what moves you, what gives you energy, and how you can contribute to the world in your own unique way.";

export default function MeetGuide() {
  const { state, dispatch } = useJourney();
  const logMeetGuideViewed = useLogEventOnce(EVENTS.MEET_GUIDE_VIEWED);
  const [isSpeaking, setIsSpeaking] = useState(true);
  useAudio("/audio/welcome.mp3");

  const phrase1 = state.name ? `Welcome, ${state.name}!` : "Welcome!";
  const introText = useMemo(
    () => [phrase1, SENTENCE_2, SENTENCE_3, SENTENCE_4].join(" "),
    [phrase1]
  );

  useEffect(() => {
    void logMeetGuideViewed();
    void updateSession(state.sessionId, { current_screen: "meet_guide" });
  }, [logMeetGuideViewed, state.sessionId]);

  useEffect(() => {
    setIsSpeaking(true);
    const timeoutId = setTimeout(() => {
      setIsSpeaking(false);
    }, SPEAKING_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, [introText]);

  const sphereState = isSpeaking ? "speaking" : "idle";

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 text-center sm:px-8">
      <div className="m-auto flex flex-col items-center">
        <Sphere state={sphereState} size={200} />
        <div className="mt-8 w-full max-w-2xl rounded-3xl border border-[#E4E9F1] bg-white/70 px-5 py-6 shadow-[0_18px_55px_rgba(15,27,45,0.08)] sm:px-8">
          <p className="text-[18px] leading-[1.7] font-normal text-[#0F1B2D] sm:text-[20px]">
            {introText}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => dispatch({ type: "GO_TO", screen: "breathing_offer" })}
          className="mt-10 h-12 rounded-full bg-primary px-7 text-primary-foreground transition-all hover:-translate-y-px hover:bg-primary/90 active:scale-[0.98]"
        >
          I&apos;M READY
        </Button>
      </div>
    </section>
  );
}