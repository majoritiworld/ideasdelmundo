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
const INACTIVE_CIRCLE_COLOR = "#AEB8C6";
const CIRCLE_COLORS_BY_POSITION = {
  top: categoryColors.passion,
  right: categoryColors.vocation,
  bottom: categoryColors.mission,
  left: categoryColors.profession,
} as const;

function withThirtyPercentOpacity(hexColor: string) {
  return `${hexColor}4D`;
}

function getSphereCircleColors(sectionId: number): readonly [string, string, string, string] {
  return [
    sectionId >= 1 ? CIRCLE_COLORS_BY_POSITION.top : INACTIVE_CIRCLE_COLOR,
    sectionId >= 3 ? CIRCLE_COLORS_BY_POSITION.bottom : INACTIVE_CIRCLE_COLOR,
    sectionId >= 4 ? CIRCLE_COLORS_BY_POSITION.left : INACTIVE_CIRCLE_COLOR,
    sectionId >= 2 ? CIRCLE_COLORS_BY_POSITION.right : INACTIVE_CIRCLE_COLOR,
  ];
}

function getSphereCircleOpacities(sectionId: number): readonly [number, number, number, number] {
  return [
    sectionId >= 1 ? 0.5 : 0.3,
    sectionId >= 3 ? 0.5 : 0.3,
    sectionId >= 4 ? 0.5 : 0.3,
    sectionId >= 2 ? 0.5 : 0.3,
  ];
}

function getHighestUnlockedSection(answeredQuestions: number[]) {
  let highestUnlockedSection = 1;

  for (const item of sections) {
    if (item.id >= TOTAL_SECTIONS) break;

    const answeredCount = item.questions.filter((question) =>
      answeredQuestions.includes(question.id)
    ).length;

    if (answeredCount < 2) break;

    highestUnlockedSection = item.id + 1;
  }

  return highestUnlockedSection;
}

function getAnsweredCountForSection(sectionId: number, answeredQuestions: number[]) {
  const targetSection = sections.find((item) => item.id === sectionId);

  return (
    targetSection?.questions.filter((question) => answeredQuestions.includes(question.id)).length ??
    0
  );
}

export default function Board() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.board");
  const logBoardViewed = useLogEventOnce(EVENTS.BOARD_VIEWED);
  const section = sections.find((item) => item.id === state.currentSection) ?? sections[0];
  const sectionColor = categoryColors[section.theme];
  const completedCardColor = withThirtyPercentOpacity(sectionColor);
  const sphereCircleColors = getSphereCircleColors(section.id);
  const sphereCircleOpacities = getSphereCircleOpacities(section.id);
  const highestUnlockedSection = getHighestUnlockedSection(state.answeredQuestions);
  const answeredInSection = section.questions.filter((question) =>
    state.answeredQuestions.includes(question.id)
  ).length;
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

  function goToUnlockedSection(sectionId: number) {
    if (sectionId === section.id || sectionId > highestUnlockedSection) return;

    dispatch({ type: "SET_CURRENT_SECTION", section: sectionId });
    void updateSession(state.sessionId, { current_section: sectionId });
  }

  return (
    <section className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(27,61,212,0.08),transparent_38%)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-48px)] max-w-4xl flex-col items-center">
        <div className="pt-2 text-center">
          <div className="mx-auto flex w-[min(560px,calc(100vw-48px))] items-center">
            {Array.from({ length: TOTAL_SECTIONS }, (_, index) => {
              const step = index + 1;
              const isCurrent = step === section.id;
              const isCompleted = getAnsweredCountForSection(step, state.answeredQuestions) >= 2;
              const canNavigate = !isCurrent && step <= highestUnlockedSection;
              const stepColor = categoryColors[sections[index].theme];

              return (
                <div key={step} className="flex flex-1 items-center last:flex-none">
                  <button
                    type="button"
                    onClick={() => goToUnlockedSection(step)}
                    disabled={!canNavigate}
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={t("sectionIndicator", { current: step, total: TOTAL_SECTIONS })}
                    className={cn(
                      "relative z-10 flex size-6 items-center justify-center rounded-full border bg-white font-mono text-[11px] font-medium transition-all",
                      isCurrent && "opacity-100 ring-4 ring-white",
                      !isCurrent && "opacity-50",
                      step > highestUnlockedSection && "cursor-default",
                      canNavigate && "cursor-pointer",
                    )}
                    style={{
                      borderColor: step <= highestUnlockedSection ? stepColor : "#D5DCE6",
                      backgroundColor: isCompleted ? stepColor : "#FFFFFF",
                      color: isCompleted ? "#FFFFFF" : stepColor,
                    }}
                  >
                    {isCompleted ? "✓" : step}
                  </button>
                  {step < TOTAL_SECTIONS ? (
                    <div className="h-px flex-1 bg-[#D5DCE6] opacity-60" />
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex justify-center">
            <Sphere
              state="idle"
              size={100}
              circleColors={sphereCircleColors}
              circleOpacities={sphereCircleOpacities}
              disableHoverEffect
            />
          </div>
          <h2 className="mt-6 text-2xl leading-tight font-medium text-[#0F1B2D]">
            {section.title}
          </h2>
        </div>

        <div className="mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {section.questions.map((question) => {
            const isAnswered = state.answeredQuestions.includes(question.id);

            return (
              <button
                key={question.id}
                type="button"
                onClick={() => openQuestion(question)}
                className={cn(
                  "flex min-h-[150px] flex-col justify-start rounded-[18px] border border-[#D5DCE6] bg-white p-5 text-left font-sans normal-case transition-all hover:-translate-y-px hover:border-primary active:scale-[0.98]",
                  isAnswered && "border-[#CBD5E1] text-[#0F1B2D]"
                )}
                style={isAnswered ? { backgroundColor: completedCardColor } : undefined}
              >
                <div className="flex items-center justify-between gap-4">
                  <span
                    className={cn(
                      "font-mono text-xs font-medium",
                      !isAnswered && "text-[#7B8FA8]"
                    )}
                    style={isAnswered ? { color: sectionColor } : undefined}
                  >
                    {t("questionNumber", { number: question.id })}
                  </span>
                  {isAnswered ? (
                    <span
                      className="text-lg font-medium"
                      style={{ color: sectionColor }}
                      aria-label={t("answeredAria")}
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

        <div className="relative z-20 mt-10 flex min-h-12 justify-center pb-4">
          {canAdvance ? (
            <Button
              type="button"
              onClick={advanceSection}
              className="h-12 rounded-full bg-primary px-7 text-primary-foreground transition-all hover:-translate-y-px hover:bg-primary/90 active:scale-[0.98]"
            >
              {section.id === TOTAL_SECTIONS ? t("finish") : t("nextSection")}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
