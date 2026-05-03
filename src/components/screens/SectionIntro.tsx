"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import IkigaiFigure from "@/components/IkigaiFigure";
import Sphere from "@/components/Sphere";
import { EVENTS } from "@/lib/events";
import { useJourney } from "@/lib/journey-context";
import { sections } from "@/lib/sections";
import { logEvent, updateSession } from "@/lib/tracking";
import { cn } from "@/lib/utils";

const WORD_REVEAL_DELAY_MS = 60;
const CORE_QUESTION_FADE_DELAY_MS = 350;
const BUTTON_FADE_DELAY_MS = 1_200;

export default function SectionIntro() {
  const { state, dispatch } = useJourney();
  const section = sections.find((item) => item.id === state.currentSection) ?? sections[0];
  const words = useMemo(
    () => section.introMessage.split(/\s+/).filter(Boolean),
    [section.introMessage]
  );
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const [showCoreQuestion, setShowCoreQuestion] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const introComplete = visibleWordCount >= words.length;
  const isFinalSection = section.id === 5;

  useEffect(() => {
    void updateSession(state.sessionId, {
      current_screen: "section_intro",
      current_section: section.id,
    });
    void logEvent(state.sessionId, EVENTS.SECTION_INTRO_VIEWED, { sectionId: section.id });
  }, [section.id, state.sessionId]);

  useEffect(() => {
    const wordTimeoutIds = words.map((_, index) =>
      setTimeout(() => {
        setVisibleWordCount((currentCount) => Math.max(currentCount, index + 1));
      }, index * WORD_REVEAL_DELAY_MS)
    );

    const questionTimeoutId = setTimeout(
      () => setShowCoreQuestion(true),
      words.length * WORD_REVEAL_DELAY_MS + CORE_QUESTION_FADE_DELAY_MS
    );
    const buttonTimeoutId = setTimeout(
      () => setShowButton(true),
      words.length * WORD_REVEAL_DELAY_MS + CORE_QUESTION_FADE_DELAY_MS + BUTTON_FADE_DELAY_MS
    );

    return () => {
      wordTimeoutIds.forEach(clearTimeout);
      clearTimeout(questionTimeoutId);
      clearTimeout(buttonTimeoutId);
    };
  }, [words]);

  function answerCoreQuestion() {
    dispatch({ type: "SET_ACTIVE_QUESTION", id: section.coreQuestion.id });
    dispatch({ type: "GO_TO", screen: "conversation" });
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 text-center sm:px-8">
      <div className="m-auto flex flex-col items-center">
        {isFinalSection ? (
          <IkigaiFigure size={200} />
        ) : (
          <Sphere state={introComplete ? "idle" : "speaking"} variant="lime" size={160} />
        )}

        <div className="mt-8 w-full max-w-2xl rounded-3xl border border-[#E4E9F1] bg-white/70 px-5 py-6 shadow-[0_18px_55px_rgba(15,27,45,0.08)] sm:px-8">
          <p
            className="text-[18px] leading-[1.7] font-normal text-[#0F1B2D] sm:text-[20px]"
            aria-label={section.introMessage}
          >
            {words.map((word, index) => (
              <span key={`${word}-${index}`} aria-hidden="true">
                <span
                  className={cn(
                    "inline-block transition-all duration-300",
                    index < visibleWordCount
                      ? "translate-y-0 opacity-100"
                      : "translate-y-1 opacity-0"
                  )}
                >
                  {word}
                </span>
                {index < words.length - 1 ? " " : ""}
              </span>
            ))}
          </p>
        </div>

        <p
          className={cn(
            "font-heading mt-8 max-w-2xl text-[30px] leading-[1.2] font-medium text-[#0F1B2D] transition-opacity duration-[1200ms] ease-out sm:text-[38px]",
            showCoreQuestion ? "opacity-100" : "opacity-0"
          )}
        >
          {section.coreQuestion.text}
        </p>

        <Button
          type="button"
          onClick={answerCoreQuestion}
          className={cn(
            "bg-primary text-primary-foreground hover:bg-primary/90 mt-10 h-12 rounded-full px-7 transition-all duration-700 hover:-translate-y-px active:scale-[0.98]",
            showButton ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"
          )}
        >
          Answer this question
        </Button>
      </div>
    </section>
  );
}
