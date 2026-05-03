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
const SENTENCE_3 = "I'm here to help you explore your purpose and connect it with your work.";
const SENTENCE_4 =
  "Together we'll discover what moves you, what gives you energy, and how you can contribute to the world in your own unique way.";

type TimedIntroSegment = {
  text: string;
  startMs: number;
  endMs: number;
};

type TimedWord = {
  word: string;
  revealAtMs: number;
};

function buildTimedWords(segments: TimedIntroSegment[]): TimedWord[] {
  return segments.flatMap((segment) => {
    const words = segment.text.split(/\s+/).filter(Boolean);
    const durationMs = segment.endMs - segment.startMs;

    return words.map((word, index) => ({
      word,
      revealAtMs:
        words.length <= 1
          ? segment.startMs
          : segment.startMs + (durationMs * index) / (words.length - 1),
    }));
  });
}

export default function MeetGuide() {
  const { state, dispatch } = useJourney();
  const logMeetGuideViewed = useLogEventOnce(EVENTS.MEET_GUIDE_VIEWED);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  useAudio("/audio/welcome.mp3");

  const phrase1 = state.name ? `Welcome, ${state.name}!` : "Welcome!";
  const introSegments = useMemo<TimedIntroSegment[]>(
    () => [
      { text: `${phrase1} ${SENTENCE_2}`, startMs: 0, endMs: 4_000 },
      { text: SENTENCE_3, startMs: 5_000, endMs: 7_000 },
      { text: SENTENCE_4, startMs: 8_000, endMs: 14_000 },
    ],
    [phrase1]
  );
  const timedWords = useMemo(() => buildTimedWords(introSegments), [introSegments]);
  const introText = useMemo(
    () => introSegments.map((segment) => segment.text).join(" "),
    [introSegments]
  );

  useEffect(() => {
    void logMeetGuideViewed();
    void updateSession(state.sessionId, { current_screen: "meet_guide" });
  }, [logMeetGuideViewed, state.sessionId]);

  useEffect(() => {
    const resetTimeoutId = setTimeout(() => {
      setIsSpeaking(true);
      setVisibleWordCount(0);
    }, 0);

    const wordTimeoutIds = timedWords.map((word, index) =>
      setTimeout(() => {
        setVisibleWordCount((currentCount) => Math.max(currentCount, index + 1));
      }, word.revealAtMs)
    );

    const timeoutId = setTimeout(() => {
      setIsSpeaking(false);
    }, SPEAKING_DURATION_MS);

    return () => {
      clearTimeout(resetTimeoutId);
      wordTimeoutIds.forEach(clearTimeout);
      clearTimeout(timeoutId);
    };
  }, [timedWords]);

  const sphereState = isSpeaking ? "speaking" : "idle";

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 text-center sm:px-8">
      <div className="m-auto flex flex-col items-center">
        <Sphere state={sphereState} size={200} />
        <div className="mt-8 w-full max-w-2xl rounded-3xl border border-[#E4E9F1] bg-white/70 px-5 py-6 shadow-[0_18px_55px_rgba(15,27,45,0.08)] sm:px-8">
          <p
            className="text-[18px] leading-[1.7] font-normal text-[#0F1B2D] sm:text-[20px]"
            aria-label={introText}
          >
            {timedWords.map((word, index) => (
              <span
                key={`${word.word}-${index}`}
                aria-hidden="true"
                className={
                  index < visibleWordCount
                    ? "opacity-100 transition-opacity duration-300"
                    : "opacity-0 transition-opacity duration-300"
                }
              >
                {word.word}
                {index < timedWords.length - 1 ? " " : ""}
              </span>
            ))}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => dispatch({ type: "GO_TO", screen: "breathing_offer" })}
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-10 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98]"
        >
          I&apos;M READY
        </Button>
      </div>
    </section>
  );
}
