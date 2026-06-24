"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import IkigaiFigure from "@/components/IkigaiFigure";
import PauseButton from "@/components/PauseButton";
import Sphere from "@/components/Sphere";
import Iconify from "@/components/ui/iconify";
import { getStorage, setStorage } from "@/hooks/use-local-storage";
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
const OPTIONAL_QUESTIONS_TOUR_STORAGE_KEY = "journey-optional-questions-tour-completed";
type OptionalBoardTourStep = "questions" | "pause";

function getSectionColor(theme: string) {
  return categoryColors[theme as keyof typeof categoryColors] ?? categoryColors.becoming;
}

export default function OptionalBoard() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.optionalBoard");
  const [mountedSectionId] = useState(() => state.currentSection);
  const [isTourVisible, setIsTourVisible] = useState(false);
  const [tourStep, setTourStep] = useState<OptionalBoardTourStep>("questions");
  const section = sections.find((item) => item.id === mountedSectionId) ?? sections[0];
  const sectionColor = getSectionColor(section.theme);
  const isFinalSection = section.id === TOTAL_SECTIONS;
  const sphereCircleColors = getSectionSphereCircleColors(section.id);
  const sphereCircleOpacities = getSectionSphereCircleOpacities(section.id);
  const showPauseHint = !state.seenPauseHint && state.currentSection === 1;
  const isPauseTourActive = isTourVisible && tourStep === "pause";

  useEffect(() => {
    void updateSession(state.sessionId, {
      current_screen: "optional_board",
      current_section: section.id,
      answered_question_ids: state.answeredQuestions,
    });
    void logEvent(state.sessionId, EVENTS.OPTIONAL_BOARD_VIEWED, { sectionId: section.id });
  }, [section.id, state.answeredQuestions, state.sessionId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsTourVisible(getStorage(OPTIONAL_QUESTIONS_TOUR_STORAGE_KEY) !== true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function goToQuestion(question: Question) {
    void logEvent(state.sessionId, EVENTS.QUESTION_OPENED, {
      questionId: question.id,
      sectionId: section.id,
    });
    dispatch({ type: "SET_ACTIVE_QUESTION", id: question.id });
    dispatch({ type: "GO_TO", screen: "conversation" });
  }

  function openQuestion(question: Question) {
    goToQuestion(question);
  }

  function showPauseTourStep() {
    setTourStep("pause");
  }

  function completeTour() {
    setStorage(OPTIONAL_QUESTIONS_TOUR_STORAGE_KEY, true);
    setIsTourVisible(false);
    setTourStep("questions");
  }

  function dismissPauseHint() {
    dispatch({ type: "MARK_PAUSE_HINT_SEEN" });
    void updateSession(state.sessionId, { seen_pause_hint: true });
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
            {t("title")}
          </h2>
          <p className="mt-3 text-[15px] leading-[1.65] text-[#5A6B82] sm:text-[17px]">
            {t("subtitle")}
          </p>
        </div>

        {showPauseHint ? (
          <div className="mt-6 flex w-full max-w-3xl items-start gap-3 rounded-2xl border border-[#B5C6F4] bg-[#EEF2FE] px-5 py-4 text-left">
            <Iconify icon="lucide:clock-3" className="mt-0.5 size-5 shrink-0 text-[#1B3DD4]" />
            <p className="flex-1 text-[14px] leading-[1.65] text-[#0F1B2D]">
              {t("pauseHint.text")}
            </p>
            <button
              type="button"
              onClick={dismissPauseHint}
              className="shrink-0 font-mono text-[11px] tracking-[0.08em] text-[#1B3DD4] underline underline-offset-4"
            >
              {t("pauseHint.dismiss")}
            </button>
          </div>
        ) : null}

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

        <div className="sticky bottom-0 z-20 mt-10 flex w-full justify-center bg-[#FAFBFE]/80 py-4 backdrop-blur">
          <div className="relative flex flex-wrap justify-center gap-3">
            <div
              className={cn(
                "relative transition-transform duration-300",
                isPauseTourActive &&
                  "z-40 scale-110 rounded-full ring-4 ring-[#1B3DD4]/15 ring-offset-4 ring-offset-white"
              )}
            >
              {isPauseTourActive ? (
                <div className="absolute bottom-full left-1/2 z-50 mb-6 w-[min(360px,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl border border-[#D5DCE6] bg-white px-5 py-4 text-center shadow-[0_18px_55px_rgba(15,27,45,0.16)]">
                  <p className="font-heading text-[20px] leading-tight font-medium text-[#0F1B2D]">
                    {t("tour.pauseTitle")}
                  </p>
                  <p className="mt-2 text-[14px] leading-6 text-[#5A6B82]">
                    {t("tour.pauseDescription")}
                  </p>
                  <Button
                    type="button"
                    onClick={completeTour}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 h-10 rounded-full px-6 text-[12px]"
                  >
                    {t("tour.done")}
                  </Button>
                </div>
              ) : null}
              <PauseButton
                floating={false}
                requireCoreAnswer={false}
                className="w-[min(360px,calc(100vw-2rem))] max-w-none"
                buttonClassName={cn(
                  "h-12 border-[#E2E8F0] bg-[#F1F5F9] px-7 text-[#64748B] hover:border-[#CBD5E1] hover:bg-[#E2E8F0] hover:text-[#475569]",
                  isPauseTourActive && "pointer-events-none"
                )}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={continueJourney}
              className="hover:border-primary h-12 rounded-full border border-[#D5DCE6] bg-white/70 px-7 text-[#0F1B2D] transition-all hover:-translate-y-px hover:bg-white active:scale-[0.98]"
            >
              {isFinalSection ? t("done") : t("nextSection")}
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={isTourVisible && tourStep === "questions"}
        onOpenChange={(open) => {
          if (!open) completeTour();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="rounded-[24px] border-[#D5DCE6] bg-white p-6 text-center shadow-2xl sm:max-w-md sm:p-7"
        >
          <DialogHeader className="items-center text-center">
            <DialogTitle className="font-heading text-[24px] leading-tight font-medium text-[#0F1B2D]">
              {t("tour.title")}
            </DialogTitle>
            <DialogDescription className="pt-2 text-[15px] leading-7 text-[#5A6B82]">
              {t("tour.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 sm:justify-center">
            <Button
              type="button"
              onClick={showPauseTourStep}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-full px-7"
            >
              {t("tour.next")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
