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
import { EVENTS } from "@/lib/events";
import { type ConversationMessage, useJourney } from "@/lib/journey-context";
import { getQuestionById } from "@/lib/sections";
import {
  getSectionSphereCircleColors,
  getSectionSphereCircleOpacities,
} from "@/lib/section-sphere";
import type { Json } from "@/lib/supabase/types";
import { logEvent, logTranscriptMessage, updateSession } from "@/lib/tracking";
import { AnimatedWords } from "@/components/ui/animations/animated-word-reveal";
import {
  JourneyChatColumn,
  JourneyScreen,
} from "@/components/journey/screen-layout";
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
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
  const returnToBoardRef = useRef<() => void>(() => {});
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
    doneStep: t("tour.doneStep"),
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
    const inputEl = inputRef.current;
    if (!inputEl) return;
    inputEl.style.height = "auto";
    inputEl.style.height = `${Math.min(inputEl.scrollHeight, 180)}px`;
  }, [input]);

  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      const scrollEl = scrollRef.current;
      if (!scrollEl) return;
      scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: "smooth" });
      messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    });
  }, [input, isThinking, messages.length, guideReveal?.count]);

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
            returnToBoardRef.current?.();
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

  function renderGuideMessageText(message: ConversationMessage, index: number) {
    const words = splitRevealWords(message.text);
    const visibleCount = getGuideVisibleWordCount(message, index);

    return (
      <p
        className="text-[14px] leading-relaxed text-[#0F1B2D]/85"
        aria-label={message.text}
      >
        <AnimatedWords words={words} visibleWordCount={visibleCount} />
      </p>
    );
  }

  function renderGuideAvatar(state: SphereProps["state"]) {
    return (
      <div
        aria-hidden="true"
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full"
      >
        <div className="pointer-events-none scale-[0.38]">
          <Sphere
            state={state}
            size={56}
            circleColors={sphereCircleColors}
            circleOpacities={sphereCircleOpacities}
            disableHoverEffect
          />
        </div>
      </div>
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

    setError(null);
    setInput("");
    setIsThinking(true);

    const currentMessages = state.conversations[activeQuestion.id] ?? messages;
    const userMessage = createMessage("user", text);
    dispatch({ type: "ADD_MESSAGE", questionId: activeQuestion.id, message: userMessage });

    try {
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
      });

      const guideMessage = createMessage("guide", response);
      const nextConversation = [...currentMessages, userMessage, guideMessage];
      const nextConversations = { ...state.conversations, [activeQuestion.id]: nextConversation };
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
      returnToBoard();
    } finally {
      setIsThinking(false);
    }
  }

  function returnToBoard() {
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
    dispatch({ type: "GO_TO", screen: "optional_board" });
  }

  returnToBoardRef.current = returnToBoard;

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
      {isTourVisible ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-[#0F1B2D]/45 backdrop-blur-[1px]"
        />
      ) : null}

      <div ref={scrollRef} className="relative flex flex-1 flex-col overflow-y-auto">
        <div className="conversation-page-in flex min-h-full flex-1 flex-col">
          <JourneyChatColumn className="flex-1 pb-4 pt-[10dvh]">
            <div
              className={cn(
                "relative flex flex-col gap-6",
                isTourTargetActive("messages") &&
                  "pointer-events-none relative z-40 rounded-2xl p-1 ring-2 ring-[#1B3DD4] ring-offset-4 ring-offset-white"
              )}
            >
              {messages.map((message, index) =>
                message.role === "guide" ? (
                  <div key={`${message.role}-${index}`} className="flex gap-3">
                    {renderGuideAvatar(
                      index === messages.length - 1 && isGuideSpeaking ? sphereState : "idle"
                    )}
                    {renderGuideMessageText(message, index)}
                  </div>
                ) : (
                  <div key={`${message.role}-${index}`} className="flex justify-end">
                    <p className="max-w-[85%] text-right text-[14px] leading-relaxed text-[#0F1B2D]/85">
                      {message.text}
                    </p>
                  </div>
                )
              )}
              {isThinking ? (
                <div className="flex gap-3">
                  {renderGuideAvatar("thinking")}
                  <p className="text-[14px] leading-relaxed text-[#0F1B2D]/45">
                    <span className="inline-flex gap-1" aria-hidden="true">
                      <span className="animate-pulse">·</span>
                      <span className="animate-pulse [animation-delay:120ms]">·</span>
                      <span className="animate-pulse [animation-delay:240ms]">·</span>
                    </span>
                    <span className="sr-only">{t("guide")}</span>
                  </p>
                </div>
              ) : null}
              <div ref={messagesEndRef} aria-hidden="true" className="h-2" />
              {renderTourCallout("messages", "top-5 left-1/2 -translate-x-1/2")}
            </div>
          </JourneyChatColumn>

          <JourneyChatColumn
            className={cn(
              "shrink-0 pb-6 pt-2 transition-opacity",
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

            <form
              onSubmit={submitMessage}
              className={cn(
                "relative flex items-center gap-2 rounded-full border border-[#D5DCE6] bg-white px-4 py-2 shadow-sm focus-within:border-[#0F1B2D]/40",
                isTourTargetActive("input") &&
                  "pointer-events-none relative z-40 ring-2 ring-[#1B3DD4] ring-offset-4 ring-offset-white"
              )}
            >
              {speechSupported ? (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    disabled={composerLocked || isTranscribing}
                    onClick={onMicClick}
                    aria-label={isRecording ? t("micRecording") : t("micStart")}
                    className={cn(
                      "font-sans flex h-8 w-8 shrink-0 items-center justify-center rounded-full normal-case transition-colors",
                      isRecording
                        ? "animate-pulse bg-[#EF4444] text-white"
                        : "text-[#0F1B2D]/55 hover:bg-[#FAFBFE] hover:text-[#0F1B2D]",
                      isTourTargetActive("mic") &&
                        "pointer-events-none relative z-40 ring-2 ring-[#1B3DD4] ring-offset-4 ring-offset-white"
                    )}
                  >
                    <Iconify icon="lucide:mic" className="size-[18px]" />
                  </button>
                  {renderTourCallout("mic", "right-0 bottom-full mb-4")}
                </div>
              ) : null}
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onComposerKeyDown}
                placeholder={t("placeholder")}
                disabled={composerLocked}
                rows={1}
                className={cn(
                  "max-h-[120px] min-h-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-0 py-1 text-[15px] leading-6 shadow-none outline-none focus-visible:ring-0",
                  isRecording
                    ? "text-[#7B8FA8] italic"
                    : "text-[#0F1B2D] not-italic placeholder:text-[#0F1B2D]/40"
                )}
              />
              <button
                type="submit"
                disabled={!input.trim() || composerLocked}
                aria-label={t("send")}
                className="font-sans shrink-0 normal-case text-[#0F1B2D]/70 transition-colors hover:text-[#0F1B2D] disabled:text-[#0F1B2D]/25"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 12L20 4l-4 16-4-7-8-1z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {renderTourCallout("input", "bottom-full left-0 mb-4")}
            </form>

            {isRecording ? (
              <p className="mt-2 ps-1 text-[12px] leading-snug text-[#5A6B82]">{t("listeningHint")}</p>
            ) : null}
            {isTranscribing ? (
              <p className="mt-2 ps-1 text-[12px] leading-snug text-[#5A6B82]">
                {t("transcribingHint")}
              </p>
            ) : null}
            {error ? (
              <p className="mt-4 text-sm leading-6 text-[#D85A30]">{error}</p>
            ) : null}
          </JourneyChatColumn>
        </div>
      </div>
    </JourneyScreen>
  );
}
