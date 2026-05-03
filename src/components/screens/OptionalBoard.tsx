"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import IkigaiFigure from "@/components/IkigaiFigure";
import Sphere from "@/components/Sphere";
import { EVENTS } from "@/lib/events";
import { useJourney } from "@/lib/journey-context";
import { categoryColors, sections, type Question } from "@/lib/sections";
import {
  getSectionSphereCircleColors,
  getSectionSphereCircleOpacities,
} from "@/lib/section-sphere";
import { logEvent, updateSession } from "@/lib/tracking";
import { cn } from "@/lib/utils";

const TOTAL_SECTIONS = 5;
const ANSWERED_CARD_BACKGROUND = "#1B3DD41A";
const ANSWERED_CHECK_COLOR = "#008925";

function getSectionColor(theme: string) {
  return categoryColors[theme as keyof typeof categoryColors] ?? categoryColors.becoming;
}

export default function OptionalBoard() {
  const { state, dispatch } = useJourney();
  const section = sections.find((item) => item.id === state.currentSection) ?? sections[0];
  const sectionColor = getSectionColor(section.theme);
  const isFinalSection = section.id === TOTAL_SECTIONS;
  const sphereCircleColors = getSectionSphereCircleColors(section.id);
  const sphereCircleOpacities = getSectionSphereCircleOpacities(section.id);

  useEffect(() => {
    void updateSession(state.sessionId, {
      current_screen: "optional_board",
      current_section: section.id,
      answered_question_ids: state.answeredQuestions,
    });
    void logEvent(state.sessionId, EVENTS.OPTIONAL_BOARD_VIEWED, { sectionId: section.id });
  }, [section.id, state.answeredQuestions, state.sessionId]);

  function openQuestion(question: Question) {
    void logEvent(state.sessionId, EVENTS.QUESTION_OPENED, {
      questionId: question.id,
      sectionId: section.id,
    });
    dispatch({ type: "SET_ACTIVE_QUESTION", id: question.id });
    dispatch({ type: "GO_TO", screen: "conversation" });
  }

  function continueJourney() {
    void logEvent(state.sessionId, EVENTS.SECTION_COMPLETED, { sectionId: section.id });

    if (isFinalSection) {
      dispatch({ type: "GO_TO", screen: "closing" });
      return;
    }

    const nextSection = section.id + 1;
    dispatch({ type: "SET_CURRENT_SECTION", sectionId: nextSection });
    void updateSession(state.sessionId, { current_section: nextSection });
    dispatch({ type: "GO_TO", screen: "section_intro" });
  }

  return (
    <section className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(27,61,212,0.08),transparent_36%)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] max-w-4xl flex-col items-center">
        <div className="flex flex-col items-center text-center">
          {isFinalSection ? (
            <IkigaiFigure size={200} />
          ) : (
            <div className="scale-[0.7]">
              <Sphere
                state="idle"
                size={100}
                circleColors={sphereCircleColors}
                circleOpacities={sphereCircleOpacities}
                disableHoverEffect
              />
            </div>
          )}

          <h2 className="font-heading mt-8 text-[28px] leading-tight font-medium text-[#0F1B2D]">
            Go deeper
          </h2>
          <p className="mt-3 text-[15px] leading-[1.65] text-[#5A6B82] sm:text-[17px]">
            These questions are optional. Explore what calls to you.
          </p>
        </div>

        <div className="mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {section.optionalQuestions.map((question) => {
            const isAnswered = state.answeredQuestions.includes(question.id);

            return (
              <button
                key={question.id}
                type="button"
                onClick={() => openQuestion(question)}
                className={cn(
                  "hover:border-primary flex min-h-[150px] flex-col justify-start rounded-[18px] border border-[#D5DCE6] bg-white p-5 text-left font-sans normal-case transition-all hover:-translate-y-px active:scale-[0.98]",
                  isAnswered && "border-[#CBD5E1] text-[#0F1B2D]"
                )}
                style={isAnswered ? { backgroundColor: ANSWERED_CARD_BACKGROUND } : undefined}
              >
                <div className="flex items-center justify-between gap-4">
                  <span
                    className="font-mono text-xs font-medium"
                    style={{ color: isAnswered ? sectionColor : "#7B8FA8" }}
                  >
                    Q{question.id}
                  </span>
                  {isAnswered ? (
                    <span
                      className="text-lg font-medium"
                      style={{ color: ANSWERED_CHECK_COLOR }}
                      aria-label="Answered"
                    >
                      ✓
                    </span>
                  ) : (
                    <span className="text-2xl leading-none text-[#7B8FA8]" aria-hidden>
                      →
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "mt-3 text-[19px] leading-[1.55] text-[#0F1B2D] normal-case",
                    isAnswered ? "font-light" : "font-medium"
                  )}
                >
                  {question.text}
                </p>
              </button>
            );
          })}
        </div>

        <div className="sticky bottom-0 z-20 mt-10 flex w-full justify-center bg-[#FAFBFE]/80 py-4 backdrop-blur">
          <Button
            type="button"
            variant="ghost"
            onClick={continueJourney}
            className="hover:border-primary h-12 rounded-full border border-[#D5DCE6] bg-white/70 px-7 text-[#0F1B2D] transition-all hover:-translate-y-px hover:bg-white active:scale-[0.98]"
          >
            {isFinalSection ? "I'm done" : "Next section"}
          </Button>
        </div>
      </div>
    </section>
  );
}
