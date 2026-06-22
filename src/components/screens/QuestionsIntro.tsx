"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Sphere from "@/components/Sphere";
import { Button } from "@/components/ui/button";
import { AnimatedWords } from "@/components/ui/animations/animated-word-reveal";
import {
  JourneyCard,
  JourneyScreen,
  JourneyScreenMain,
  journeyPrimaryButtonClassName,
} from "@/components/journey/screen-layout";
import { useJourney } from "@/lib/journey-context";
import { updateSession } from "@/lib/tracking";
import { useAudio } from "@/lib/useAudio";

const SPEAKING_DURATION_MS = 17_000;
const HALF_SECOND_PAUSE_MS = 500;
const QUESTIONS_INTRO_AUDIO_PAUSES = [
  { atMs: 3_500, durationMs: HALF_SECOND_PAUSE_MS },
  { atMs: 12_500, durationMs: HALF_SECOND_PAUSE_MS },
] as const;

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

export default function QuestionsIntro() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.questionsIntro");
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  useAudio("/audio/questions-intro.mp3", { delayMs: 0, pauses: QUESTIONS_INTRO_AUDIO_PAUSES });

  const introSegments = useMemo<TimedIntroSegment[]>(
    () => [
      { text: t("subtitleSegments.ready"), startMs: 0, endMs: 1_000 },
      { text: t("subtitleSegments.sectionsQuestions"), startMs: 2_000, endMs: 3_500 },
      { text: t("subtitleSegments.sectionsEach"), startMs: 4_000, endMs: 6_500 },
      { text: t("subtitleSegments.instructionsSection"), startMs: 7_000, endMs: 7_500 },
      { text: t("subtitleSegments.instructionsAnswer"), startMs: 8_000, endMs: 10_000 },
      { text: t("subtitleSegments.instructionsEndStart"), startMs: 11_000, endMs: 12_500 },
      { text: t("subtitleSegments.instructionsEndFinish"), startMs: 13_000, endMs: 14_000 },
    ],
    [t]
  );
  const timedWords = useMemo(() => buildTimedWords(introSegments), [introSegments]);
  const introText = useMemo(
    () => introSegments.map((segment) => segment.text).join(" "),
    [introSegments]
  );

  useEffect(() => {
    void updateSession(state.sessionId, {
      current_screen: "questions_intro",
      status: "in_progress",
    });
  }, [state.sessionId]);

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
    <JourneyScreen>
      <JourneyScreenMain>
        <Sphere state={sphereState} size={200} />
        <JourneyCard>
          <p
            className="text-[18px] leading-[1.7] font-normal text-[#0F1B2D] sm:text-[20px]"
            aria-label={introText}
          >
            <AnimatedWords
              words={timedWords.map((word) => word.word)}
              visibleWordCount={visibleWordCount}
              getWordKey={(word, index) => `${word}-${index}`}
            />
          </p>
        </JourneyCard>
        <Button
          type="button"
          onClick={() => dispatch({ type: "GO_TO", screen: "section_intro" })}
          className={journeyPrimaryButtonClassName}
        >
          {t("cta")}
        </Button>
      </JourneyScreenMain>
    </JourneyScreen>
  );
}
