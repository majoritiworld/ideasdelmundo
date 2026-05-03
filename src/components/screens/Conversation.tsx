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
import { sendChatMessage } from "@/lib/chat";
import { EVENTS } from "@/lib/events";
import { type ConversationMessage, useJourney } from "@/lib/journey-context";
import { getQuestionById } from "@/lib/sections";
import {
  getSectionSphereCircleColors,
  getSectionSphereCircleOpacities,
} from "@/lib/section-sphere";
import type { Json } from "@/lib/supabase/types";
import { logEvent, updateSession } from "@/lib/tracking";
import { cn } from "@/lib/utils";

function createMessage(role: ConversationMessage["role"], text: string): ConversationMessage {
  return {
    role,
    text,
    timestamp: new Date().toISOString(),
  };
}

function splitMessageWords(text: string): string[] {
  const t = text.trim();
  return t ? t.split(/\s+/g) : [];
}

type GuideRevealState = { key: string; count: number };

const EMPTY_MESSAGES: ConversationMessage[] = [];

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
  const showDoneWithQuestionButton =
    !doneWithQuestionFlowActive &&
    !isInputLockedForReveal &&
    !isThinking &&
    !isRecording &&
    userMessageCount >= 3;

  micShortcutGuardsRef.current = {
    speechSupported,
    isRecording,
    isTranscribing,
    composerLocked,
  };

  useEffect(() => {
    setSpeechSupported(typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia);
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
    dispatch({
      type: "ADD_MESSAGE",
      questionId: question.id,
      message: createMessage("guide", question.openingMessage),
    });
  }, [dispatch, messages.length, question]);

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

    const wordList = splitMessageWords(last.text);
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
    }, 55);

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

  function guideDisplayText(message: ConversationMessage, index: number): string {
    if (message.role !== "guide") return message.text;
    const isLast = index === messages.length - 1;
    if (!isLast) return message.text;
    const revealKey = `${activeQuestion.id}-${message.timestamp}`;
    if (guideReveal?.key === revealKey) {
      const words = splitMessageWords(message.text);
      return words.slice(0, guideReveal.count).join(" ");
    }
    return message.text;
  }

  async function submitMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const text = input.trim();
    if (
      !text ||
      isThinking ||
      !state.sessionId ||
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
      isTranscribing ||
      !state.sessionId
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
      void updateSession(state.sessionId, { conversations: nextConversations as unknown as Json });
    } catch (err) {
      pendingDoneAfterRevealKeyRef.current = null;
      setDoneWithQuestionFlowActive(false);
      setError(err instanceof Error ? err.message : t("fallbackError"));
    } finally {
      setIsThinking(false);
    }
  }

  function returnToBoard() {
    const s = stateRef.current;
    const qId = activeQuestionIdRef.current;
    const secId = activeSectionIdRef.current;
    const isCoreQuestion = activeIsCoreRef.current;
    if (qId == null || secId == null || !s.sessionId) return;

    const currentConversation = s.conversations[qId] ?? EMPTY_MESSAGES;
    const doneText = t("doneWithQuestion");
    const hasUserAnswer = currentConversation.some(
      (message) => message.role === "user" && message.text.trim() !== doneText
    );
    const answeredQuestionIds = hasUserAnswer
      ? Array.from(new Set([...s.answeredQuestions, qId]))
      : s.answeredQuestions;

    if (hasUserAnswer) {
      void logEvent(s.sessionId, EVENTS.QUESTION_ANSWERED, {
        questionId: qId,
        sectionId: secId,
        messageCount: currentConversation.length,
      });
    }

    void updateSession(s.sessionId, {
      answered_question_ids: answeredQuestionIds,
      conversations: s.conversations as unknown as Json,
    });

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

  return (
    <section className="relative mx-auto flex h-screen min-h-screen w-full max-w-4xl flex-col px-5 text-center sm:px-8">
      <div className="absolute top-5 left-1/2 w-full max-w-3xl -translate-x-1/2 text-left sm:top-8">
        <Button
          type="button"
          variant="ghost"
          onClick={returnToBoard}
          className="hover:border-primary hover:text-primary h-10 rounded-full border border-[#D5DCE6] bg-transparent px-4 text-[#5A6B82] hover:bg-white"
        >
          {t("back")}
        </Button>
      </div>

      <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col pt-20 pb-8">
        <div className="flex shrink-0 flex-col items-center text-center">
          <div>
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
            className="h-full space-y-5 overflow-y-auto rounded-2xl border border-[#D5DCE6] bg-white/70 px-5 pt-8 pb-6 text-left"
          >
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`}>
                <p
                  className={`mb-1 text-[12px] font-medium ${message.role === "user" ? "text-[#1B3DD4]" : "text-[#7B8FA8]"}`}
                >
                  {message.role === "user" ? t("you") : t("guide")}
                </p>
                <p className="text-[16px] leading-[1.65] text-[#0F1B2D]">
                  {guideDisplayText(message, index)}
                </p>
              </div>
            ))}
            {isThinking ? (
              <div>
                <p className="mb-1 text-[12px] font-medium text-[#7B8FA8]">{t("guide")}</p>
                <p className="text-[16px] leading-[1.65] text-[#0F1B2D]">...</p>
              </div>
            ) : null}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>
        </div>

        {error ? <p className="mt-4 max-w-md text-sm leading-6 text-[#D85A30]">{error}</p> : null}

        <div
          className={cn(
            "mt-5 shrink-0 text-left transition-opacity",
            composerLocked && "pointer-events-none opacity-50"
          )}
        >
          <form onSubmit={submitMessage} className="flex flex-col gap-1">
            <div className="flex items-end gap-3">
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
                      : "hover:text-primary border-[#D5DCE6] bg-white text-[#5A6B82] hover:bg-white"
                  )}
                >
                  <Iconify icon="lucide:mic" className="mx-auto size-5" />
                </Button>
              ) : null}
              <Button
                type="submit"
                disabled={!input.trim() || composerLocked}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98]"
              >
                {t("send")}
              </Button>
            </div>
            {isRecording ? (
              <p className="ps-5 text-[12px] leading-snug text-[#5A6B82]">{t("listeningHint")}</p>
            ) : null}
            {isTranscribing ? (
              <p className="ps-5 text-[12px] leading-snug text-[#5A6B82]">
                {t("transcribingHint")}
              </p>
            ) : null}
          </form>
          {showDoneWithQuestionButton ? (
            <button
              type="button"
              onClick={() => void submitDoneWithQuestion()}
              className="mx-auto mt-3 flex font-sans text-[13px] font-normal text-[#7B8FA8] normal-case underline decoration-[#AAB6C5] underline-offset-4 hover:text-[#5A6B82]"
            >
              {t("doneWithQuestion")}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
