"use client";

import {
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Iconify from "@/components/ui/iconify";
import { Textarea } from "@/components/ui/textarea";
import Sphere, { type SphereProps } from "@/components/Sphere";
import { getStorage, setStorage } from "@/hooks/use-local-storage";
import { sendChatMessage } from "@/lib/chat";
import { buildPriorContext } from "@/lib/prior-context";
import { EVENTS } from "@/lib/events";
import { type ConversationMessage, useJourney } from "@/lib/journey-context";
import { getQuestionById, sections } from "@/lib/sections";
import {
  getSectionSphereCircleColors,
  getSectionSphereCircleOpacities,
} from "@/lib/section-sphere";
import type { Json } from "@/lib/supabase/types";
import { logEvent, logTranscriptMessage, updateSession } from "@/lib/tracking";
import { AnimatedWords } from "@/components/ui/animations/animated-word-reveal";
import { JourneyScreen } from "@/components/journey/screen-layout";
import { WORD_REVEAL_INTERVAL_MS, splitRevealWords } from "@/lib/text-reveal";
import { cn } from "@/lib/utils";

function createMessage(role: ConversationMessage["role"], text: string): ConversationMessage {
  return {
    role,
    text,
    timestamp: new Date().toISOString(),
  };
}

function logTranscriptMessages(
  sessionId: string | null,
  questionId: number,
  messages: ConversationMessage[],
  sequenceStart: number,
  metadata: Record<string, Json | undefined> = {}
) {
  void Promise.all(
    messages.map((message, index) =>
      logTranscriptMessage(sessionId, {
        card_id: questionId,
        role: message.role,
        content: message.text,
        sequence: sequenceStart + index,
        metadata,
        created_at: message.timestamp,
      })
    )
  );
}

const EMPTY_MESSAGES: ConversationMessage[] = [];
const CONVERSATION_TOUR_STORAGE_KEY = "journey-conversation-tour-completed";
const HARD_MESSAGE_CAP = 6;
const TOTAL_SECTIONS = sections.length;

type GuideRevealState = { key: string; count: number };

type ConversationTourTarget = "input" | "mic" | "messages" | "done";
type ConversationTourMessageKey = "input" | "mic" | "messages" | "doneStep";

const CONVERSATION_TOUR_STEPS: Array<{
  target: ConversationTourTarget;
  messageKey: ConversationTourMessageKey;
}> = [
  { target: "input", messageKey: "input" },
  { target: "mic", messageKey: "mic" },
  { target: "done", messageKey: "doneStep" },
  { target: "messages", messageKey: "messages" },
];

export default function Conversation() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.conversation");
  const tCoreRun = useTranslations("journey.coreRun");
  const tDeepDive = useTranslations("journey.deepDive");
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isGuideSpeaking, setIsGuideSpeaking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [guideReveal, setGuideReveal] = useState<GuideRevealState | null>(null);
  const [doneWithQuestionFlowActive, setDoneWithQuestionFlowActive] = useState(false);
  const [isTourVisible, setIsTourVisible] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const initializedQuestionId = useRef<number | null>(null);
  const completedGuideRevealRef = useRef<Set<string>>(new Set());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;
  const activeQuestionIdRef = useRef<number | null>(null);
  const activeSectionIdRef = useRef<number | null>(null);
  const activeIsCoreRef = useRef(false);
  const pendingDoneAfterRevealKeyRef = useRef<string | null>(null);
  const doneNavigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishQuestionRef = useRef<() => void>(() => {});
  const micShortcutGuardsRef = useRef({
    speechSupported: false,
    isRecording: false,
    isTranscribing: false,
    composerLocked: false,
  });

  const active = useMemo(
    () => (state.activeQuestionId === null ? null : getQuestionById(state.activeQuestionId)),
    [state.activeQuestionId]
  );
  const question = active?.question;
  const section = active?.section;
  const isCore = active?.isCore ?? false;
  const sectionId = section?.id ?? state.currentSection;
  const sphereCircleColors = getSectionSphereCircleColors(sectionId);
  const sphereCircleOpacities = getSectionSphereCircleOpacities(sectionId);
  const messages = useMemo(
    () => (question ? (state.conversations[question.id] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES),
    [question, state.conversations]
  );
  const isUserComposing = input.trim().length > 0 || isRecording;
  const sphereState: SphereProps["state"] = isThinking
    ? "thinking"
    : isGuideSpeaking
      ? "speaking"
      : isUserComposing
        ? "listening"
        : "idle";

  const isInputLockedForReveal = guideReveal !== null;
  const composerLocked =
    isThinking || isInputLockedForReveal || doneWithQuestionFlowActive || isTranscribing;
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const tourSteps = useMemo(
    () =>
      speechSupported
        ? CONVERSATION_TOUR_STEPS
        : CONVERSATION_TOUR_STEPS.filter((step) => step.target !== "mic"),
    [speechSupported]
  );
  const activeTourStep = isTourVisible ? tourSteps[tourStepIndex] : null;
  const isDoneTourStep = activeTourStep?.target === "done";
  const showDoneWithQuestionButton =
    !doneWithQuestionFlowActive &&
    !isInputLockedForReveal &&
    !isThinking &&
    !isRecording &&
    (userMessageCount >= 1 || isDoneTourStep);
  const tourCopy: Record<ConversationTourMessageKey, string> = {
    input: t("tour.input"),
    mic: t("tour.mic"),
    messages: t("tour.messages"),
    doneStep: isCore ? t("tour.doneStep") : t("tour.doneStepDeepDive"),
  };
  const tourStepNumber = tourStepIndex + 1;

  micShortcutGuardsRef.current = {
    speechSupported,
    isRecording,
    isTranscribing,
    composerLocked,
  };

  useEffect(() => {
    const hasSpeechSupport = typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
    setSpeechSupported(hasSpeechSupport);
    setIsTourVisible(getStorage(CONVERSATION_TOUR_STORAGE_KEY) !== true);
  }, []);

  useEffect(() => {
    void updateSession(state.sessionId, { current_screen: "conversation" });
  }, [state.sessionId]);

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    const inputEl = inputRef.current;
    if (!inputEl) return;

    const previousScrollTop = scrollEl?.scrollTop ?? 0;
    inputEl.style.height = "auto";
    inputEl.style.height = `${Math.min(inputEl.scrollHeight, 180)}px`;

    if (scrollEl) {
      scrollEl.scrollTop = previousScrollTop;
    }
  }, [input]);

  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      const scrollEl = scrollRef.current;
      if (!scrollEl) return;
      scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: "smooth" });
    });
  }, [isThinking, messages.length, guideReveal?.count]);

  useEffect(() => {
    if (!question || initializedQuestionId.current === question.id || messages.length > 0) return;
    initializedQuestionId.current = question.id;
    const openingMessage = createMessage("guide", question.openingMessage);
    dispatch({
      type: "ADD_MESSAGE",
      questionId: question.id,
      message: openingMessage,
    });
    logTranscriptMessages(state.sessionId, question.id, [openingMessage], 0, {
      source: "question_opening",
    });
  }, [dispatch, messages.length, question, state.sessionId]);

  useEffect(() => {
    if (!isGuideSpeaking) return;
    const timeoutId = window.setTimeout(() => setIsGuideSpeaking(false), 1_200);
    return () => window.clearTimeout(timeoutId);
  }, [isGuideSpeaking, messages.length]);

  useEffect(() => {
    return () => {
      if (doneNavigateTimeoutRef.current) {
        clearTimeout(doneNavigateTimeoutRef.current);
        doneNavigateTimeoutRef.current = null;
      }
    };
  }, []);

  useLayoutEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const postRevealUi = (revealKey: string) => {
      requestAnimationFrame(() => {
        if (pendingDoneAfterRevealKeyRef.current === revealKey) {
          pendingDoneAfterRevealKeyRef.current = null;
          if (doneNavigateTimeoutRef.current) clearTimeout(doneNavigateTimeoutRef.current);
          doneNavigateTimeoutRef.current = setTimeout(() => {
            doneNavigateTimeoutRef.current = null;
            finishQuestionRef.current?.();
          }, 1_500);
          return;
        }
        inputRef.current?.focus();
      });
    };

    const completeReveal = (revealKey: string) => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (!cancelled) {
        completedGuideRevealRef.current.add(revealKey);
        setGuideReveal(null);
        postRevealUi(revealKey);
      }
    };

    if (!question) {
      setGuideReveal(null);
      return () => {
        cancelled = true;
        if (intervalId !== null) clearInterval(intervalId);
      };
    }

    const last = messages[messages.length - 1];
    if (!last || last.role !== "guide") {
      setGuideReveal(null);
      return () => {
        cancelled = true;
        if (intervalId !== null) clearInterval(intervalId);
      };
    }

    const revealKey = `${question.id}-${last.timestamp}`;
    if (completedGuideRevealRef.current.has(revealKey)) {
      setGuideReveal(null);
      return () => {
        cancelled = true;
        if (intervalId !== null) clearInterval(intervalId);
      };
    }

    const wordList = splitRevealWords(last.text);
    if (wordList.length === 0) {
      completedGuideRevealRef.current.add(revealKey);
      setGuideReveal(null);
      if (!cancelled) postRevealUi(revealKey);
      return () => {
        cancelled = true;
      };
    }

    setGuideReveal({ key: revealKey, count: 1 });

    if (wordList.length <= 1) {
      completeReveal(revealKey);
      return () => {
        cancelled = true;
        if (intervalId !== null) clearInterval(intervalId);
      };
    }

    let shown = 1;
    intervalId = setInterval(() => {
      if (cancelled) return;
      shown += 1;
      if (shown >= wordList.length) {
        setGuideReveal({ key: revealKey, count: wordList.length });
        completeReveal(revealKey);
      } else {
        setGuideReveal({ key: revealKey, count: shown });
      }
    }, WORD_REVEAL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, [messages, question]);

  const startRecording = useCallback(async () => {
    if (
      !speechSupported ||
      isThinking ||
      isInputLockedForReveal ||
      isRecording ||
      isTranscribing ||
      doneWithQuestionFlowActive
    )
      return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");

        try {
          const res = await fetch("/api/transcribe", { method: "POST", body: formData });
          const { text } = (await res.json()) as { text?: string };
          if (text) setInput((prev) => `${prev} ${text}`.trim());
        } catch (err) {
          console.error("[Conversation] Whisper transcription failed:", err);
          setError(err instanceof Error ? err.message : t("fallbackError"));
        } finally {
          setIsTranscribing(false);
          mediaRecorderRef.current = null;
          audioChunksRef.current = [];
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("[Conversation] MediaRecorder start failed:", err);
      setIsRecording(false);
      setIsTranscribing(false);
      setError(err instanceof Error ? err.message : t("fallbackError"));
    }
  }, [
    speechSupported,
    isThinking,
    isInputLockedForReveal,
    isRecording,
    isTranscribing,
    doneWithQuestionFlowActive,
    t,
  ]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    setIsRecording(false);
    setIsTranscribing(true);
  }, []);

  const startRecordingRef = useRef(startRecording);
  startRecordingRef.current = startRecording;
  const stopRecordingRef = useRef(stopRecording);
  stopRecordingRef.current = stopRecording;

  useEffect(() => {
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key !== " ") return;
      const g = micShortcutGuardsRef.current;
      if (!g.speechSupported || g.isTranscribing || g.composerLocked) return;
      if (event.repeat || event.isComposing) return;
      if (document.activeElement === inputRef.current) return;
      event.preventDefault();
      if (g.isRecording) {
        stopRecordingRef.current();
      } else {
        void startRecordingRef.current();
      }
    };
    document.addEventListener("keydown", onDocumentKeyDown);
    return () => document.removeEventListener("keydown", onDocumentKeyDown);
  }, []);

  if (!question || !section) {
    return null;
  }

  const activeQuestion = question;
  const activeSection = section;
  activeQuestionIdRef.current = activeQuestion.id;
  activeSectionIdRef.current = activeSection.id;
  activeIsCoreRef.current = isCore;

  function getGuideVisibleWordCount(message: ConversationMessage, index: number): number {
    const words = splitRevealWords(message.text);
    const isLast = index === messages.length - 1;
    if (!isLast) return words.length;

    const revealKey = `${activeQuestion.id}-${message.timestamp}`;
    if (guideReveal?.key === revealKey) return guideReveal.count;
    return words.length;
  }

  function renderMessageContent(message: ConversationMessage, index: number) {
    if (message.role === "user") {
      return (
        <p className="text-[16px] leading-[1.65] text-[#0F1B2D]">{message.text}</p>
      );
    }

    const words = splitRevealWords(message.text);
    const visibleCount = getGuideVisibleWordCount(message, index);

    return (
      <p className="text-[16px] leading-[1.65] text-[#0F1B2D]" aria-label={message.text}>
        <AnimatedWords words={words} visibleWordCount={visibleCount} />
      </p>
    );
  }

  async function submitMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const text = input.trim();
    if (
      !text ||
      isThinking ||
      isInputLockedForReveal ||
      isTranscribing ||
      doneWithQuestionFlowActive
    )
      return;

    const currentMessages = state.conversations[activeQuestion.id] ?? messages;
    const outgoingUserMessageCount =
      currentMessages.filter((message) => message.role === "user").length + 1;
    if (outgoingUserMessageCount > HARD_MESSAGE_CAP) return;

    setError(null);
    setInput("");
    setIsThinking(true);

    const userMessage = createMessage("user", text);
    dispatch({ type: "ADD_MESSAGE", questionId: activeQuestion.id, message: userMessage });

    try {
      const priorContext = buildPriorContext(
        state.conversations,
        activeQuestion.id,
        t("doneWithQuestion")
      );

      const response = await sendChatMessage({
        questionId: activeQuestion.id,
        questionText: activeQuestion.text,
        sectionTheme: activeSection.theme,
        isCore,
        conversationHistory: currentMessages.map((message) => ({
          role: message.role === "guide" ? "assistant" : "user",
          content: message.text,
        })),
        userMessage: text,
        sessionId: state.sessionId,
        userMessageCount: outgoingUserMessageCount,
        priorContext,
      });

      const guideMessage = createMessage("guide", response);
      const nextConversation = [...currentMessages, userMessage, guideMessage];
      const nextConversations = { ...state.conversations, [activeQuestion.id]: nextConversation };
      if (outgoingUserMessageCount >= HARD_MESSAGE_CAP) {
        pendingDoneAfterRevealKeyRef.current = `${activeQuestion.id}-${guideMessage.timestamp}`;
        setDoneWithQuestionFlowActive(true);
      }
      dispatch({ type: "ADD_MESSAGE", questionId: activeQuestion.id, message: guideMessage });
      setIsGuideSpeaking(true);
      void logEvent(state.sessionId, EVENTS.AI_RESPONSE_RECEIVED, {
        questionId: activeQuestion.id,
        responseLength: response.length,
      });
      logTranscriptMessages(
        state.sessionId,
        activeQuestion.id,
        [userMessage, guideMessage],
        currentMessages.length,
        {
          sectionId: activeSection.id,
          isCore,
        }
      );
      void updateSession(state.sessionId, { conversations: nextConversations as unknown as Json });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("fallbackError"));
    } finally {
      setIsThinking(false);
    }
  }

  async function submitDoneWithQuestion() {
    if (
      isThinking ||
      isInputLockedForReveal ||
      doneWithQuestionFlowActive ||
      isRecording ||
      isTranscribing
    ) {
      return;
    }
    const doneText = t("doneWithQuestion");
    setError(null);
    setDoneWithQuestionFlowActive(true);

    setIsThinking(true);

    const currentMessages = state.conversations[activeQuestion.id] ?? messages;
    const userMessage = createMessage("user", doneText);
    dispatch({ type: "ADD_MESSAGE", questionId: activeQuestion.id, message: userMessage });

    try {
      const doneUserMessageCount =
        currentMessages.filter((message) => message.role === "user").length + 1;

      const priorContext = buildPriorContext(
        state.conversations,
        activeQuestion.id,
        doneText
      );

      const response = await sendChatMessage({
        questionId: activeQuestion.id,
        questionText: activeQuestion.text,
        sectionTheme: activeSection.theme,
        isCore,
        conversationHistory: currentMessages.map((message) => ({
          role: message.role === "guide" ? "assistant" : "user",
          content: message.text,
        })),
        userMessage: doneText,
        sessionId: state.sessionId,
        userMessageCount: doneUserMessageCount,
        priorContext,
      });

      const guideMessage = createMessage("guide", response);
      const nextConversation = [...currentMessages, userMessage, guideMessage];
      const nextConversations = { ...state.conversations, [activeQuestion.id]: nextConversation };
      pendingDoneAfterRevealKeyRef.current = `${activeQuestion.id}-${guideMessage.timestamp}`;
      dispatch({ type: "ADD_MESSAGE", questionId: activeQuestion.id, message: guideMessage });
      setIsGuideSpeaking(true);
      void logEvent(state.sessionId, EVENTS.AI_RESPONSE_RECEIVED, {
        questionId: activeQuestion.id,
        responseLength: response.length,
      });
      logTranscriptMessages(
        state.sessionId,
        activeQuestion.id,
        [userMessage, guideMessage],
        currentMessages.length,
        {
          sectionId: activeSection.id,
          isCore,
          source: "done_with_question",
        }
      );
      void updateSession(state.sessionId, { conversations: nextConversations as unknown as Json });
    } catch (err) {
      pendingDoneAfterRevealKeyRef.current = null;
      console.warn("[Conversation] Done guide response failed:", err);
      finishQuestion();
    } finally {
      setIsThinking(false);
    }
  }

  function finishQuestion() {
    const s = stateRef.current;
    const qId = activeQuestionIdRef.current;
    const secId = activeSectionIdRef.current;
    const isCoreQuestion = activeIsCoreRef.current;
    if (qId == null || secId == null) return;

    const currentConversation = s.conversations[qId] ?? EMPTY_MESSAGES;
    const doneText = t("doneWithQuestion");
    const hasUserAnswer = currentConversation.some(
      (message) => message.role === "user" && message.text.trim() !== doneText
    );
    const answeredQuestionIds = hasUserAnswer
      ? Array.from(new Set([...s.answeredQuestions, qId]))
      : s.answeredQuestions;
    const coreAnsweredIds =
      hasUserAnswer && isCoreQuestion ? Array.from(new Set([...s.coreAnswered, secId])) : s.coreAnswered;

    if (hasUserAnswer) {
      void logEvent(s.sessionId, EVENTS.QUESTION_ANSWERED, {
        questionId: qId,
        sectionId: secId,
        messageCount: currentConversation.length,
      });
    }

    void updateSession(s.sessionId, {
      answered_question_ids: answeredQuestionIds,
      core_answered: coreAnsweredIds,
      conversations: s.conversations as unknown as Json,
    });

    dispatch({ type: "SET_CURRENT_SECTION", sectionId: secId });
    if (hasUserAnswer) {
      dispatch({ type: "MARK_QUESTION_ANSWERED", id: qId });
      if (isCoreQuestion) {
        dispatch({ type: "MARK_CORE_ANSWERED", sectionId: secId });
      }
    }
    dispatch({ type: "SET_ACTIVE_QUESTION", id: null });

    if (!isCoreQuestion) {
      dispatch({ type: "GO_TO", screen: "deep_dive" });
      return;
    }

    if (secId < TOTAL_SECTIONS) {
      void logEvent(s.sessionId, EVENTS.SECTION_COMPLETED, { sectionId: secId });
      const nextSection = secId + 1;
      dispatch({ type: "SET_CURRENT_SECTION", sectionId: nextSection });
      void updateSession(s.sessionId, { current_section: nextSection });
      dispatch({ type: "GO_TO", screen: "section_intro" });
      return;
    }

    void logEvent(s.sessionId, EVENTS.SECTION_COMPLETED, { sectionId: secId });
    dispatch({ type: "GO_TO", screen: "closing" });
  }

  finishQuestionRef.current = finishQuestion;

  function onMicClick() {
    if (isRecording) {
      stopRecording();
      return;
    }
    void startRecording();
  }

  function onComposerKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    void submitMessage();
  }

  function completeTour() {
    setStorage(CONVERSATION_TOUR_STORAGE_KEY, true);
    setIsTourVisible(false);
    setTourStepIndex(0);
    if (!composerLocked) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function goToNextTourStep() {
    if (tourStepIndex >= tourSteps.length - 1) {
      completeTour();
      return;
    }
    setTourStepIndex((currentIndex) => currentIndex + 1);
  }

  function isTourTargetActive(target: ConversationTourTarget) {
    return activeTourStep?.target === target;
  }

  function renderTourCallout(target: ConversationTourTarget, className: string) {
    if (!activeTourStep || activeTourStep.target !== target) return null;

    const isLastStep = tourStepIndex >= tourSteps.length - 1;

    return (
      <div
        className={cn(
          "pointer-events-auto absolute z-50 w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl border border-[#D5DCE6] bg-white p-4 text-left shadow-2xl",
          className
        )}
        role="dialog"
        aria-live="polite"
      >
        <p className="mb-2 text-[11px] font-semibold tracking-[0.2em] text-[#7B8FA8] uppercase">
          {t("tour.stepLabel", { current: tourStepNumber, total: tourSteps.length })}
        </p>
        <p className="text-sm leading-6 text-[#0F1B2D]">{tourCopy[activeTourStep.messageKey]}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={completeTour}
            className="font-sans text-[13px] text-[#7B8FA8] underline decoration-[#AAB6C5] underline-offset-4 hover:text-[#5A6B82]"
          >
            {t("tour.skip")}
          </button>
          <Button
            type="button"
            onClick={goToNextTourStep}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-full px-5 text-[13px]"
          >
            {isLastStep ? t("tour.done") : t("tour.next")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <JourneyScreen variant="chat">
      <div className="pointer-events-none fixed inset-x-0 top-4 z-10 flex justify-center">
        <span className="font-mono text-[11px] tracking-[0.08em] text-[#7B8FA8]">
          {isCore
            ? tCoreRun("progress", { current: sectionId, total: TOTAL_SECTIONS })
            : tDeepDive("progressLabel")}
        </span>
      </div>

      {isTourVisible ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-[#0F1B2D]/45 backdrop-blur-[1px]"
        />
      ) : null}

      <section className="relative mx-auto flex h-dvh min-h-dvh w-full max-w-4xl flex-col px-5 text-center sm:px-8">
        <div className="conversation-page-in mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col pt-20 pb-8">
          <div className="flex shrink-0 flex-col items-center text-center">
            <div className="scale-[0.7]">
              <Sphere
                state={sphereState}
                size={100}
                circleColors={sphereCircleColors}
                circleOpacities={sphereCircleOpacities}
                disableHoverEffect
              />
            </div>
          </div>

          <div className="relative mt-6 min-h-0 flex-1">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-px top-px z-10 h-12 rounded-t-2xl bg-gradient-to-b from-white/95 via-white/70 to-transparent"
            />
            <div
              ref={scrollRef}
              className={cn(
                "relative h-full space-y-5 overflow-y-auto rounded-2xl border border-[#D5DCE6] bg-white/70 px-5 pt-8 pb-6 text-left",
                isTourTargetActive("messages") &&
                  "pointer-events-none z-40 ring-2 ring-[#1B3DD4] ring-offset-4 ring-offset-white"
              )}
            >
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`}>
                  <p
                    className={cn(
                      "mb-1 text-[12px] font-medium",
                      message.role === "user" ? "text-[#1B3DD4]" : "text-[#7B8FA8]"
                    )}
                  >
                    {message.role === "user" ? t("you") : t("guide")}
                  </p>
                  {renderMessageContent(message, index)}
                </div>
              ))}
              {isThinking ? (
                <div>
                  <p className="mb-1 text-[12px] font-medium text-[#7B8FA8]">{t("guide")}</p>
                  <p className="text-[16px] leading-[1.65] text-[#0F1B2D]/45">
                    <span className="inline-flex gap-1" aria-hidden="true">
                      <span className="animate-pulse">·</span>
                      <span className="animate-pulse [animation-delay:120ms]">·</span>
                      <span className="animate-pulse [animation-delay:240ms]">·</span>
                    </span>
                  </p>
                </div>
              ) : null}
              {renderTourCallout("messages", "top-5 left-1/2 -translate-x-1/2")}
            </div>
          </div>

          {error ? <p className="mt-4 max-w-md text-left text-sm leading-6 text-[#D85A30]">{error}</p> : null}

          <div
            className={cn(
              "relative mt-5 shrink-0 text-left transition-opacity",
              composerLocked &&
                !isTourTargetActive("input") &&
                !isTourTargetActive("mic") &&
                !isTourTargetActive("done") &&
                "pointer-events-none opacity-50"
            )}
          >
            {showDoneWithQuestionButton ? (
              <div className="relative mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void submitDoneWithQuestion()}
                  disabled={isDoneTourStep}
                  className={cn(
                    "font-sans rounded-lg border border-[#D5DCE6] bg-white px-4 py-2 text-[13px] font-medium normal-case text-[#0F1B2D] transition-colors hover:border-[#0F1B2D]/40",
                    isTourTargetActive("done") &&
                      "pointer-events-none relative z-40 ring-2 ring-[#1B3DD4] ring-offset-4 ring-offset-white"
                  )}
                >
                  {t("doneWithQuestion")}
                </button>
                {renderTourCallout("done", "bottom-full left-0 mb-4")}
              </div>
            ) : null}

            <form onSubmit={submitMessage} className="relative flex flex-col gap-1">
              <div
                className={cn(
                  "flex items-end gap-3",
                  isTourTargetActive("input") &&
                    "pointer-events-none relative z-40 rounded-[24px] ring-2 ring-[#1B3DD4] ring-offset-4 ring-offset-white"
                )}
              >
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={onComposerKeyDown}
                  placeholder={t("placeholder")}
                  disabled={composerLocked}
                  rows={1}
                  className={cn(
                    "max-h-[180px] min-h-12 resize-none overflow-y-auto rounded-[24px] border-[#D5DCE6] bg-white px-5 py-3 leading-6 shadow-none placeholder:text-[#7B8FA8] focus-visible:border-[#1B3DD4] focus-visible:ring-[#1B3DD4]/15",
                    isRecording ? "text-[#7B8FA8] italic" : "text-[#0F1B2D] not-italic"
                  )}
                />
                {speechSupported ? (
                  <div className="relative shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={composerLocked || isTranscribing}
                      onClick={onMicClick}
                      aria-label={isRecording ? t("micRecording") : t("micStart")}
                      className={cn(
                        "h-12 w-12 shrink-0 rounded-full p-0 shadow-none",
                        isRecording
                          ? "animate-pulse border-transparent bg-[#EF4444] text-white hover:bg-[#EF4444] hover:text-white"
                          : "hover:text-primary border-[#D5DCE6] bg-white text-[#5A6B82] hover:bg-white",
                        isTourTargetActive("mic") &&
                          "pointer-events-none relative z-40 ring-2 ring-[#1B3DD4] ring-offset-4 ring-offset-white"
                      )}
                    >
                      <Iconify icon="lucide:mic" className="mx-auto size-5" />
                    </Button>
                    {renderTourCallout("mic", "right-0 bottom-full mb-4")}
                  </div>
                ) : null}
                <Button
                  type="submit"
                  disabled={!input.trim() || composerLocked}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98]"
                >
                  {t("send")}
                </Button>
              </div>
              {renderTourCallout("input", "bottom-full left-0 mb-4")}
              {isRecording ? (
                <p className="ps-5 text-[12px] leading-snug text-[#5A6B82]">{t("listeningHint")}</p>
              ) : null}
              {isTranscribing ? (
                <p className="ps-5 text-[12px] leading-snug text-[#5A6B82]">
                  {t("transcribingHint")}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </section>
    </JourneyScreen>
  );
}
