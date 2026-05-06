"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Sphere from "@/components/Sphere";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce } from "@/lib/journey-context";
import { getSectionSphereCircleColors } from "@/lib/section-sphere";
import { updateSession } from "@/lib/tracking";

const WORD_REVEAL_INTERVAL_MS = 90;
const PARAGRAPH_PAUSE_MS = 400;
const BUTTON_REVEAL_DELAY_MS = 800;
const SPEAKING_ANIMATION_EXTRA_MS = 0;
const multicolorSphereCircleColors = getSectionSphereCircleColors(5);
const multicolorSphereCircleOpacities = [0.3, 0.3, 0.3, 0.3] as const;

type IntroParagraph = {
  text: string;
  className: string;
};

type TimedWord = {
  word: string;
  index: number;
  revealAtMs: number;
};

type TimedIntroParagraph = IntroParagraph & {
  words: TimedWord[];
};

function buildTimedParagraphs(paragraphs: IntroParagraph[]): TimedIntroParagraph[] {
  let nextStartMs = 0;
  let nextWordIndex = 0;

  return paragraphs.map((paragraph) => {
    const words = paragraph.text.split(/\s+/).filter(Boolean);
    const timedWords = words.map((word, index) => ({
      word,
      index: nextWordIndex++,
      revealAtMs: nextStartMs + WORD_REVEAL_INTERVAL_MS * index,
    }));
    const lastWord = timedWords[timedWords.length - 1];

    if (lastWord) {
      nextStartMs = lastWord.revealAtMs + PARAGRAPH_PAUSE_MS;
    }

    return {
      ...paragraph,
      words: timedWords,
    };
  });
}

export default function MeetGuide() {
  const { state, dispatch } = useJourney();
  const logMeetGuideViewed = useLogEventOnce(EVENTS.MEET_GUIDE_VIEWED);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const [isButtonVisible, setIsButtonVisible] = useState(false);

  const introParagraphs = useMemo<IntroParagraph[]>(
    () => [
      {
        text: `Hi ${state.name}, I'll be your guide in this experience.`,
        className:
          "font-['ArizonaFlare'] text-[26px] leading-tight font-medium text-[#0F1B2D] sm:text-[40px]",
      },
      {
        text: "Over the next 20-30 minutes, you'll answer questions about what moves you, what you're good at, and what the world needs from you.",
        className: "text-[20px] leading-[1.65] font-normal text-[#0F1B2D]",
      },
      {
        text: "At the end, you'll receive your personal archetype and a Purpose Blueprint crafted just for you by our team.",
        className: "text-[20px] leading-[1.65] font-normal text-[#0F1B2D]",
      },
    ],
    [state.name]
  );
  const timedParagraphs = useMemo(
    () => buildTimedParagraphs(introParagraphs),
    [introParagraphs]
  );
  const timedWords = useMemo(
    () => timedParagraphs.flatMap((paragraph) => paragraph.words),
    [timedParagraphs]
  );
  const buttonRevealAtMs =
    (timedWords[timedWords.length - 1]?.revealAtMs ?? 0) + BUTTON_REVEAL_DELAY_MS;

  useEffect(() => {
    void logMeetGuideViewed();
    void updateSession(state.sessionId, { current_screen: "meet_guide" });
  }, [logMeetGuideViewed, state.sessionId]);

  useEffect(() => {
    const resetTimeoutId = setTimeout(() => {
      setIsSpeaking(true);
      setVisibleWordCount(0);
      setIsButtonVisible(false);
    }, 0);

    const wordTimeoutIds = timedWords.map((word, index) =>
      setTimeout(() => {
        setVisibleWordCount((currentCount) => Math.max(currentCount, index + 1));
      }, word.revealAtMs)
    );

    const speakingTimeoutId = setTimeout(() => {
      setIsSpeaking(false);
    }, buttonRevealAtMs + SPEAKING_ANIMATION_EXTRA_MS);

    const buttonTimeoutId = setTimeout(() => {
      setIsButtonVisible(true);
    }, buttonRevealAtMs);

    return () => {
      clearTimeout(resetTimeoutId);
      wordTimeoutIds.forEach(clearTimeout);
      clearTimeout(speakingTimeoutId);
      clearTimeout(buttonTimeoutId);
    };
  }, [buttonRevealAtMs, timedWords]);

  const sphereState = isSpeaking ? "speaking" : "idle";

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 text-center sm:px-8">
      <div className="m-auto flex flex-col items-center">
        <Sphere
          state={sphereState}
          size={200}
          circleColors={multicolorSphereCircleColors}
          circleOpacities={multicolorSphereCircleOpacities}
        />
        {timedParagraphs.slice(0, 1).map((paragraph, paragraphIndex) => (
          <p
            key={`${paragraph.text}-${paragraphIndex}`}
            className={`${paragraph.className} mt-8`}
            aria-label={paragraph.text}
          >
            {paragraph.words.map((word, wordIndex) => (
              <span
                key={`${word.word}-${word.index}`}
                aria-hidden="true"
                className={
                  word.index < visibleWordCount
                    ? "opacity-100 transition-opacity duration-300"
                    : "opacity-0 transition-opacity duration-300"
                }
              >
                {word.word}
                {wordIndex < paragraph.words.length - 1 ? " " : ""}
              </span>
            ))}
          </p>
        ))}
        <div className="mt-6 w-full max-w-2xl space-y-4 rounded-3xl border border-[#E4E9F1] bg-white/70 px-5 py-6 shadow-[0_18px_55px_rgba(15,27,45,0.08)] sm:px-8">
          {timedParagraphs.slice(1).map((paragraph, paragraphIndex) => (
            <p
              key={`${paragraph.text}-${paragraphIndex + 1}`}
              className={paragraph.className}
              aria-label={paragraph.text}
            >
              {paragraph.words.map((word, wordIndex) => (
                <span
                  key={`${word.word}-${word.index}`}
                  aria-hidden="true"
                  className={
                    word.index < visibleWordCount
                      ? "opacity-100 transition-opacity duration-300"
                      : "opacity-0 transition-opacity duration-300"
                  }
                >
                  {word.word}
                  {wordIndex < paragraph.words.length - 1 ? " " : ""}
                </span>
              ))}
            </p>
          ))}
        </div>
        <Button
          type="button"
          onClick={() => dispatch({ type: "GO_TO", screen: "breathing_offer" })}
          disabled={isSpeaking}
          className={`bg-primary text-primary-foreground hover:bg-primary/90 mt-10 h-12 rounded-full px-7 transition-all duration-[1200ms] ease-in-out hover:-translate-y-px active:scale-[0.98] disabled:cursor-not-allowed ${
            isButtonVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          I&apos;m ready
        </Button>
      </div>
    </section>
  );
}
