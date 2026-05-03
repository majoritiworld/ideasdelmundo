"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Sphere from "@/components/Sphere";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce } from "@/lib/journey-context";
import { categoryColors, getSectionQuestions, sections, type Question } from "@/lib/sections";
import {
  getSectionSphereCircleColors,
  getSectionSphereCircleOpacities,
} from "@/lib/section-sphere";
import { logEvent, updateSession } from "@/lib/tracking";
import { useAudio } from "@/lib/useAudio";
import { cn } from "@/lib/utils";

const TOTAL_SECTIONS = 4;
const STEPPER_ACTIVE_GRAY = "#6B7280";
const STEPPER_INACTIVE_GRAY = "#D5DCE6";
const STEPPER_TEXT_GRAY = "#4B5563";
const SECTION_SPEAKING_DURATIONS_MS: Partial<Record<number, number>> = {
  1: 6_000,
  2: 5_000,
  3: 5_000,
  4: 5_000,
};
const SECTION_REVEAL_CLASS =
  "animate-[board-section-reveal_650ms_cubic-bezier(0.22,1,0.36,1)_both]";

const SECTION_INTRO_SEGMENTS: Record<
  number,
  Array<Omit<TimedIntroSegment, "text"> & { key: string }>
> = {
  1: [
    { key: "alive", startMs: 0, endMs: 1_500 },
    { key: "time", startMs: 2_500, endMs: 3_500 },
    { key: "answers", startMs: 4_500, endMs: 5_500 },
  ],
  2: [
    { key: "gifts", startMs: 0, endMs: 1_700 },
    { key: "modest", startMs: 2_100, endMs: 3_100 },
    { key: "know", startMs: 3_500, endMs: 4_900 },
  ],
  3: [
    { key: "place", startMs: 0, endMs: 1_700 },
    { key: "moves", startMs: 2_100, endMs: 3_100 },
    { key: "instincts", startMs: 3_500, endMs: 4_900 },
  ],
  4: [
    { key: "value", startMs: 0, endMs: 1_700 },
    { key: "honest", startMs: 2_100, endMs: 3_100 },
    { key: "between", startMs: 3_500, endMs: 4_900 },
  ],
};

type TimedIntroSegment = {
  text: string;
  startMs: number;
  endMs: number;
};

type TimedWord = {
  word: string;
  revealAtMs: number;
  segmentIndex: number;
  wordIndex: number;
};

function buildTimedWords(segments: TimedIntroSegment[]): TimedWord[] {
  return segments.flatMap((segment, segmentIndex) => {
    const words = segment.text.split(/\s+/).filter(Boolean);
    const durationMs = segment.endMs - segment.startMs;

    return words.map((word, wordIndex) => ({
      word,
      revealAtMs:
        words.length <= 1
          ? segment.startMs
          : segment.startMs + (durationMs * wordIndex) / (words.length - 1),
      segmentIndex,
      wordIndex,
    }));
  });
}

function withThirtyPercentOpacity(hexColor: string) {
  return `${hexColor}4D`;
}

function getSectionColor(theme: string) {
  return categoryColors[theme as keyof typeof categoryColors] ?? categoryColors.becoming;
}

function getHighestUnlockedSection(answeredQuestions: number[]) {
  let highestUnlockedSection = 1;

  for (const item of sections) {
    if (item.id >= TOTAL_SECTIONS) break;

    const answeredCount = getSectionQuestions(item).filter((question) =>
      answeredQuestions.includes(question.id)
    ).length;

    if (answeredCount < 2) break;

    highestUnlockedSection = item.id + 1;
  }

  return highestUnlockedSection;
}

function getAnsweredCountForSection(sectionId: number, answeredQuestions: number[]) {
  const targetSection = sections.find((item) => item.id === sectionId);

  return targetSection
    ? getSectionQuestions(targetSection).filter((question) =>
        answeredQuestions.includes(question.id)
      ).length
    : 0;
}

export default function Board() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.board");
  const logBoardViewed = useLogEventOnce(EVENTS.BOARD_VIEWED);
  const section = sections.find((item) => item.id === state.currentSection) ?? sections[0];
  const sectionId = section.id;
  const [isSectionSpeaking, setIsSectionSpeaking] = useState(false);
  const [isSectionIntroVisible, setIsSectionIntroVisible] = useState(false);
  const [voiceoverSectionId, setVoiceoverSectionId] = useState<number | null>(null);
  const sectionVoiceoversPlayedRef = useRef(state.sectionVoiceoversPlayed);
  const [visibleIntroWordCount, setVisibleIntroWordCount] = useState(0);
  const sectionColor = getSectionColor(section.theme);
  const sectionQuestions = getSectionQuestions(section);
  const completedCardColor = withThirtyPercentOpacity(sectionColor);
  const sphereCircleColors = getSectionSphereCircleColors(section.id);
  const sphereCircleOpacities = getSectionSphereCircleOpacities(section.id);
  const highestUnlockedSection = getHighestUnlockedSection(state.answeredQuestions);
  const answeredInSection = sectionQuestions.filter((question) =>
    state.answeredQuestions.includes(question.id)
  ).length;
  const canAdvance = answeredInSection >= 2;
  const hasSectionIntro = sectionId in SECTION_INTRO_SEGMENTS;
  const isSectionIntroActive = hasSectionIntro && isSectionIntroVisible;
  const introSegments: TimedIntroSegment[] = (SECTION_INTRO_SEGMENTS[sectionId] ?? []).map(
    (segment) => ({
      ...segment,
      text: t(`sectionIntros.${sectionId}.${segment.key}`),
    })
  );
  const timedIntroWords = buildTimedWords(introSegments);
  const introText = introSegments.map((segment) => segment.text).join(" ");
  useAudio(`/audio/section-${voiceoverSectionId ?? section.id}.mp3`, {
    enabled: voiceoverSectionId !== null,
  });

  useEffect(() => {
    sectionVoiceoversPlayedRef.current = state.sectionVoiceoversPlayed;
  }, [state.sectionVoiceoversPlayed]);

  useEffect(() => {
    void logBoardViewed();
    void updateSession(state.sessionId, {
      current_screen: "board",
      current_section: state.currentSection,
      answered_question_ids: state.answeredQuestions,
    });
  }, [logBoardViewed, state.answeredQuestions, state.currentSection, state.sessionId]);

  useEffect(() => {
    const timeoutIds: Array<ReturnType<typeof setTimeout>> = [];

    const setupTimeoutId = setTimeout(() => {
      const hasPlayedSectionVoiceover = sectionVoiceoversPlayedRef.current.includes(section.id);

      if (hasPlayedSectionVoiceover) {
        setVoiceoverSectionId(null);
        setIsSectionSpeaking(false);
        setIsSectionIntroVisible(false);
        return;
      }

      setVoiceoverSectionId(section.id);
      dispatch({ type: "MARK_SECTION_VOICEOVER_PLAYED", section: section.id });
      setVisibleIntroWordCount(0);
      setIsSectionIntroVisible(hasSectionIntro);

      const speakingDuration = SECTION_SPEAKING_DURATIONS_MS[section.id];
      setIsSectionSpeaking(Boolean(speakingDuration));

      if (!speakingDuration) return;

      if (hasSectionIntro) {
        timeoutIds.push(
          ...timedIntroWords.map((word, index) =>
            setTimeout(() => {
              setVisibleIntroWordCount((currentCount) => Math.max(currentCount, index + 1));
            }, word.revealAtMs)
          )
        );
      }

      timeoutIds.push(
        setTimeout(() => {
          setIsSectionSpeaking(false);
        }, speakingDuration)
      );
    }, 0);

    return () => {
      clearTimeout(setupTimeoutId);
      timeoutIds.forEach(clearTimeout);
    };
  }, [dispatch, hasSectionIntro, section.id, timedIntroWords]);

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
    dispatch({ type: "SET_CURRENT_SECTION", sectionId: nextSection });
    void updateSession(state.sessionId, { current_section: nextSection });
  }

  function continueFromSectionIntro() {
    setIsSectionIntroVisible(false);
  }

  function goToUnlockedSection(sectionId: number) {
    if (sectionId === section.id || sectionId > highestUnlockedSection) return;

    dispatch({ type: "SET_CURRENT_SECTION", sectionId });
    void updateSession(state.sessionId, { current_section: sectionId });
  }

  return (
    <section className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(27,61,212,0.08),transparent_38%)]" />

      <div
        className={cn(
          "relative z-10 mx-auto flex min-h-[calc(100vh-48px)] max-w-4xl flex-col items-center",
          isSectionIntroActive && "justify-center"
        )}
      >
        <div className="pt-2 text-center">
          {!isSectionIntroActive ? (
            <div
              className={cn(
                "mx-auto flex w-[min(560px,calc(100vw-48px))] items-center",
                hasSectionIntro && SECTION_REVEAL_CLASS
              )}
            >
              {Array.from({ length: TOTAL_SECTIONS }, (_, index) => {
                const step = index + 1;
                const isCurrent = step === section.id;
                const isCompleted = getAnsweredCountForSection(step, state.answeredQuestions) >= 2;
                const canNavigate = !isCurrent && step <= highestUnlockedSection;

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
                        isCurrent && "opacity-100 ring-4 ring-[#E5E7EB]",
                        !isCurrent && "opacity-50",
                        step > highestUnlockedSection && "cursor-default",
                        canNavigate && "cursor-pointer"
                      )}
                      style={{
                        borderColor:
                          step <= highestUnlockedSection
                            ? STEPPER_ACTIVE_GRAY
                            : STEPPER_INACTIVE_GRAY,
                        backgroundColor: isCompleted ? STEPPER_ACTIVE_GRAY : "#FFFFFF",
                        color: isCompleted ? "#FFFFFF" : STEPPER_TEXT_GRAY,
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
          ) : null}
          <div className="mt-8 flex justify-center">
            <Sphere
              state={isSectionSpeaking ? "speaking" : "idle"}
              size={100}
              circleColors={sphereCircleColors}
              circleOpacities={sphereCircleOpacities}
              disableHoverEffect
            />
          </div>
          <h2 className="mt-6 text-2xl leading-tight font-medium text-[#0F1B2D]">
            {section.title}
          </h2>
          {isSectionIntroActive ? (
            <>
              <div className="mt-8 w-full max-w-2xl rounded-3xl border border-[#E4E9F1] bg-white/70 px-5 py-6 shadow-[0_18px_55px_rgba(15,27,45,0.08)] sm:px-8">
                <p
                  className="text-[18px] leading-[1.7] font-normal text-[#0F1B2D] sm:text-[20px]"
                  aria-label={introText}
                >
                  {timedIntroWords.map((word, index) => (
                    <span key={`${word.word}-${index}`} aria-hidden="true">
                      {word.segmentIndex === 2 && word.wordIndex === 0 ? <br /> : null}
                      <span
                        className={
                          index < visibleIntroWordCount
                            ? "inline-block translate-y-0 opacity-100 transition-all duration-300"
                            : "inline-block translate-y-1 opacity-0 transition-all duration-300"
                        }
                      >
                        {word.word}
                      </span>
                      {index < timedIntroWords.length - 1 &&
                      !(
                        word.segmentIndex !== timedIntroWords[index + 1]?.segmentIndex &&
                        timedIntroWords[index + 1]?.segmentIndex === 2
                      )
                        ? " "
                        : ""}
                    </span>
                  ))}
                </p>
              </div>
              <div className="mt-10 flex h-12 justify-center">
                <Button
                  type="button"
                  onClick={continueFromSectionIntro}
                  disabled={isSectionSpeaking}
                  className={cn(
                    "bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-full px-7 transition-all duration-500 hover:-translate-y-px active:scale-[0.98]",
                    isSectionSpeaking && "pointer-events-none translate-y-1 opacity-0"
                  )}
                >
                  {t("continue")}
                </Button>
              </div>
            </>
          ) : null}
        </div>

        {!isSectionIntroActive ? (
          <>
            <div
              className={cn(
                "mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2",
                hasSectionIntro && SECTION_REVEAL_CLASS
              )}
            >
              {sectionQuestions.map((question) => {
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

            <div
              className={cn(
                "relative z-20 mt-10 flex min-h-12 justify-center pb-4",
                hasSectionIntro && SECTION_REVEAL_CLASS
              )}
            >
              {canAdvance ? (
                <Button
                  type="button"
                  onClick={advanceSection}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98]"
                >
                  {section.id === TOTAL_SECTIONS ? t("finish") : t("nextSection")}
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-not-allowed">
                        <Button
                          type="button"
                          disabled
                          className="bg-primary text-primary-foreground h-12 rounded-full px-7 opacity-45"
                        >
                          {section.id === TOTAL_SECTIONS ? t("finish") : t("nextSection")}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">{t("answerRequirement")}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </>
        ) : null}
      </div>
      <style jsx global>{`
        @keyframes board-section-reveal {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
