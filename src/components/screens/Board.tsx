"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Sphere from "@/components/Sphere";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce } from "@/lib/journey-context";
import { categoryColors, sections, type Question } from "@/lib/sections";
import { logEvent, updateSession } from "@/lib/tracking";
import { cn } from "@/lib/utils";

const TOTAL_SECTIONS = 4;

export default function Board() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.board");
  const logBoardViewed = useLogEventOnce(EVENTS.BOARD_VIEWED);
  const section = sections.find((item) => item.id === state.currentSection) ?? sections[0];
  const answeredInSection = section.questions.filter((question) => state.answeredQuestions.includes(question.id)).length;
  const canAdvance = answeredInSection >= 2;

  useEffect(() => {
    void logBoardViewed();
    void updateSession(state.sessionId, {
      current_screen: "board",
      current_section: state.currentSection,
      answered_question_ids: state.answeredQuestions,
    });
  }, [logBoardViewed, state.answeredQuestions, state.currentSection, state.sessionId]);

  function openQuestion(question: Question) {
    void logEvent(state.sessionId, EVENTS.QUESTION_OPENED, {
      questionId: question.id,
      sectionId: section.id,
    });
    dispatch({ type: "SET_ACTIVE_QUESTION", id: question.id });
    dispatch({ type: "GO_TO", screen: "conversation" });
  }

  function advanceSection() {
    void logEvent(state.sessionId, EVENTS.SECTION_COMPLETED, { sectionId: section.id });

    if (section.id >= TOTAL_SECTIONS) {
      dispatch({ type: "GO_TO", screen: "closing" });
      return;
    }

    const nextSection = section.id + 1;
    dispatch({ type: "SET_CURRENT_SECTION", section: nextSection });
    void updateSession(state.sessionId, { current_section: nextSection });
  }

  return (
    <section className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(27,61,212,0.08),transparent_38%)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-48px)] max-w-4xl flex-col items-center">
        <div className="pt-2 text-center">
          <div className="inline-flex rounded-full border border-[#D5DCE6] bg-white px-3 py-1.5 text-xs font-medium text-[#7B8FA8]">
            {t("sectionIndicator", { current: section.id, total: TOTAL_SECTIONS })}
          </div>
          <div className="mt-8 flex justify-center">
            <Sphere state="idle" size={100} />
          </div>
          <h2 className="mt-6 text-2xl font-medium leading-tight text-[#0F1B2D]">{section.title}</h2>
        </div>

        <div className="mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {section.questions.map((question) => (
            <button
              key={question.id}
              type="button"
              onClick={() => openQuestion(question)}
              className={cn(
                "min-h-[150px] rounded-[18px] border border-[#D5DCE6] bg-white p-5 text-left transition-all hover:-translate-y-px hover:border-[#1B3DD4] active:scale-[0.98]",
                state.answeredQuestions.includes(question.id) && "border-[#B5C6F4] bg-[#EEF2FE] text-[#5A6B82]",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs font-medium text-[#7B8FA8]">{t("questionNumber", { number: question.id })}</span>
                {state.answeredQuestions.includes(question.id) ? (
                  <span className="text-lg font-medium text-[#1D9E75]" aria-label={t("answeredAria")}>
                    ✓
                  </span>
                ) : (
                  <span className="text-lg text-[#7B8FA8]" aria-hidden>
                    →
                  </span>
                )}
              </div>
              <p className="mt-6 text-[15px] font-medium leading-[1.55] text-[#0F1B2D]">{question.text}</p>
              <div className="mt-5 h-1 w-12 rounded-full" style={{ backgroundColor: categoryColors[section.theme] }} />
            </button>
          ))}
        </div>

        <div className="relative z-20 mt-10 flex min-h-12 justify-center pb-4">
          {canAdvance ? (
            <Button
              type="button"
              onClick={advanceSection}
              className="h-12 rounded-full bg-[#1B3DD4] px-7 text-white transition-all hover:-translate-y-px hover:bg-[#1632B0] active:scale-[0.98]"
            >
              {section.id === TOTAL_SECTIONS ? t("finish") : t("nextSection")}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
