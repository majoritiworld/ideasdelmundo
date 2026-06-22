"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import IkigaiFigure from "@/components/IkigaiFigure";
import PauseButton from "@/components/PauseButton";
import {
  JourneyBoardBackdrop,
  JourneyBoardCanvas,
  JourneyHero,
  JourneyScreen,
  JourneyStickyFooter,
  journeyTightGap,
} from "@/components/journey/screen-layout";
import { EVENTS } from "@/lib/events";
import { useJourney } from "@/lib/journey-context";
import { categoryColors, sections, type Question } from "@/lib/sections";
import { logEvent, updateSession } from "@/lib/tracking";
import { cn } from "@/lib/utils";

const ANSWERED_CARD_BACKGROUND = "#1B3DD41A";
const ANSWERED_CHECK_COLOR = "#008925";

function getSectionColor(theme: string) {
  return categoryColors[theme as keyof typeof categoryColors] ?? categoryColors.passion;
}

export default function DeepDive() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.deepDive");

  useEffect(() => {
    void updateSession(state.sessionId, {
      current_screen: "deep_dive",
      answered_question_ids: state.answeredQuestions,
    });
    void logEvent(state.sessionId, EVENTS.DEEP_DIVE_VIEWED);
  }, [state.answeredQuestions, state.sessionId]);

  function openQuestion(question: Question, sectionId: number) {
    void logEvent(state.sessionId, EVENTS.QUESTION_OPENED, {
      questionId: question.id,
      sectionId,
    });
    dispatch({ type: "SET_CURRENT_SECTION", sectionId });
    dispatch({ type: "SET_ACTIVE_QUESTION", id: question.id });
    dispatch({ type: "GO_TO", screen: "conversation" });
  }

  function finishDeepDive() {
    dispatch({ type: "GO_TO", screen: "closing" });
  }

  return (
    <JourneyScreen variant="board">
      <JourneyBoardBackdrop />

      <JourneyBoardCanvas>
        <JourneyHero>
          <IkigaiFigure size={200} />

          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-[28px] leading-tight font-medium text-[#0F1B2D]">
              {t("title")}
            </h2>
            <p className="text-[15px] leading-[1.65] text-[#5A6B82] sm:text-[17px]">{t("subtitle")}</p>
            <p className="text-[15px] leading-[1.65] text-[#5A6B82] sm:text-[17px]">{t("subtitleFootnote")}</p>
          </div>
        </JourneyHero>

        <div className="flex w-full flex-col gap-10">
          {sections.map((section) => {
            const sectionColor = getSectionColor(section.theme);

            return (
              <section key={section.id} className="w-full">
                <h3
                  className="mb-4 text-left font-mono text-[11px] font-medium tracking-[0.12em] uppercase"
                  style={{ color: sectionColor }}
                >
                  {section.title}
                </h3>

                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                  {section.optionalQuestions.map((question) => {
                    const isAnswered = state.answeredQuestions.includes(question.id);

                    return (
                      <button
                        key={question.id}
                        type="button"
                        onClick={() => openQuestion(question, section.id)}
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
                            {t("questionLabel", { id: question.id })}
                          </span>
                          {isAnswered ? (
                            <span
                              className="text-lg font-medium"
                              style={{ color: ANSWERED_CHECK_COLOR }}
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
              </section>
            );
          })}
        </div>

        <JourneyStickyFooter>
          <div className={cn("flex flex-row flex-wrap items-center justify-center", journeyTightGap)}>
            <PauseButton
              floating={false}
              requireCoreAnswer={false}
              buttonClassName="h-12 shrink-0 rounded-full border-[#E2E8F0] bg-[#F1F5F9] px-7 font-sans text-[15px] normal-case tracking-normal text-[#64748B] hover:border-[#CBD5E1] hover:bg-[#E2E8F0] hover:text-[#475569]"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={finishDeepDive}
              className="hover:border-primary h-12 shrink-0 rounded-full border border-[#D5DCE6] bg-white/70 px-7 text-[#0F1B2D] transition-all hover:-translate-y-px hover:bg-white active:scale-[0.98]"
            >
              {t("done")}
            </Button>
          </div>
        </JourneyStickyFooter>
      </JourneyBoardCanvas>
    </JourneyScreen>
  );
}
