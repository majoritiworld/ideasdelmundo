"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Sphere from "@/components/Sphere";
import { EVENTS } from "@/lib/events";
import { useJourney } from "@/lib/journey-context";
import {
  getSectionSphereCircleColors,
  getSectionSphereCircleOpacities,
} from "@/lib/section-sphere";
import { sections } from "@/lib/sections";
import { logEvent, updateSession } from "@/lib/tracking";
import { cn } from "@/lib/utils";

const INTRO_ANIMATION_DURATION_MS = 4_000;
const QUESTION_REVEAL_START_MS = 2_500;

interface RevealLine {
  text: string;
  words: string[];
  startIndex: number;
}

function getLineRevealDelay(index: number, totalWords: number, startMs: number, durationMs: number) {
  if (totalWords <= 1) return startMs;
  return startMs + (durationMs * index) / (totalWords - 1);
}

export default function SectionIntro() {
  const { state, dispatch } = useJourney();
  const section = sections.find((item) => item.id === state.currentSection) ?? sections[0];
  const revealLines = useMemo<RevealLine[]>(() => {
    let startIndex = 0;

    return [section.introMessage, section.coreQuestion.text].map((text) => {
      const words = text.split(/\s+/).filter(Boolean);
      const line = { text, words, startIndex };
      startIndex += words.length;
      return line;
    });
  }, [section.coreQuestion.text, section.introMessage]);
  const revealWordCount = revealLines.reduce((count, line) => count + line.words.length, 0);
  const revealText = revealLines.map((line) => line.text).join(" ");
  const sphereCircleColors = getSectionSphereCircleColors(section.id);
  const sphereCircleOpacities = getSectionSphereCircleOpacities(section.id);
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const introComplete = visibleWordCount >= revealWordCount;

  useEffect(() => {
    void updateSession(state.sessionId, {
      current_screen: "section_intro",
      current_section: section.id,
    });
    void logEvent(state.sessionId, EVENTS.SECTION_INTRO_VIEWED, { sectionId: section.id });
  }, [section.id, state.sessionId]);

  useEffect(() => {
    const resetTimeoutId = setTimeout(() => {
      setVisibleWordCount(0);
      setShowButton(false);
    }, 0);

    const wordTimeoutIds = revealLines.flatMap((line, lineIndex) => {
      const startMs = lineIndex === 0 ? 0 : QUESTION_REVEAL_START_MS;
      const durationMs =
        lineIndex === 0 ? QUESTION_REVEAL_START_MS - 1_000 : INTRO_ANIMATION_DURATION_MS - startMs;

      return line.words.map((_, wordIndex) =>
        setTimeout(() => {
          const visibleCount = line.startIndex + wordIndex + 1;
          setVisibleWordCount((currentCount) => Math.max(currentCount, visibleCount));
        }, getLineRevealDelay(wordIndex, line.words.length, startMs, durationMs))
      );
    });

    const buttonTimeoutId = setTimeout(() => setShowButton(true), INTRO_ANIMATION_DURATION_MS);

    return () => {
      clearTimeout(resetTimeoutId);
      wordTimeoutIds.forEach(clearTimeout);
      clearTimeout(buttonTimeoutId);
    };
  }, [revealLines]);

  function answerCoreQuestion() {
    dispatch({ type: "SET_ACTIVE_QUESTION", id: section.coreQuestion.id });
    dispatch({ type: "GO_TO", screen: "conversation" });
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 text-center sm:px-8">
      <div className="m-auto flex flex-col items-center">
        <Sphere
          state={introComplete ? "idle" : "speaking"}
          size={160}
          circleColors={sphereCircleColors}
          circleOpacities={sphereCircleOpacities}
          disableHoverEffect
        />

        <div className="mt-8 w-full max-w-[592px] rounded-3xl border border-[#E4E9F1] bg-white/70 px-5 py-6 shadow-[0_18px_55px_rgba(15,27,45,0.08)] sm:px-8">
          <span className="sr-only">{revealText}</span>
          <div className="space-y-5" aria-hidden="true">
            {revealLines.map((line, lineIndex) => (
              <p
                key={line.text}
                className={cn(
                  "text-[#0F1B2D]",
                  lineIndex === 0
                    ? "text-[18px] leading-[1.7] font-normal sm:text-[20px]"
                    : "font-heading text-[28px] leading-[1.25] font-medium sm:text-[34px]"
                )}
              >
                {line.words.map((word, wordIndex) => {
                  const revealIndex = line.startIndex + wordIndex;

                  return (
                    <span key={`${word}-${wordIndex}`}>
                      <span
                        className={cn(
                          "inline-block transition-all duration-300",
                          revealIndex < visibleWordCount
                            ? "translate-y-0 opacity-100"
                            : "translate-y-1 opacity-0"
                        )}
                      >
                        {word}
                      </span>
                      {wordIndex < line.words.length - 1 ? " " : ""}
                    </span>
                  );
                })}
              </p>
            ))}
          </div>

        </div>

        <Button
          type="button"
          onClick={answerCoreQuestion}
          disabled={!showButton}
          className={cn(
            "bg-primary text-primary-foreground hover:bg-primary/90 mt-8 h-12 rounded-full px-7 transition-all duration-700 hover:-translate-y-px active:scale-[0.98] disabled:cursor-not-allowed",
            showButton ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"
          )}
        >
          Answer this question
        </Button>
      </div>
    </section>
  );
}
