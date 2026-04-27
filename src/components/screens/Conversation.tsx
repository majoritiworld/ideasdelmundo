"use client";

import { FormEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Iconify from "@/components/ui/iconify";
import { Input } from "@/components/ui/input";
import Sphere, { type SphereProps } from "@/components/Sphere";
import { sendChatMessage } from "@/lib/chat";
import { EVENTS } from "@/lib/events";
import { type ConversationMessage, useJourney } from "@/lib/journey-context";
import { getQuestionById } from "@/lib/sections";
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

/** Minimal typing for the Web Speech API (names vary across browsers and TS lib versions). */
type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
  };
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function isSpeechRecognitionAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
}

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
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
  const [guideReveal, setGuideReveal] = useState<GuideRevealState | null>(null);
  const [doneWithQuestionFlowActive, setDoneWithQuestionFlowActive] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const initializedQuestionId = useRef<number | null>(null);
  const completedGuideRevealRef = useRef<Set<string>>(new Set());
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef("");
  const snapshotBeforeMicRef = useRef<string | null>(null);
  const speechExitModeRef = useRef<"none" | "escape" | "error">("none");
  const inputForMicRef = useRef(input);
  inputForMicRef.current = input;
  const stateRef = useRef(state);
  stateRef.current = state;
  const activeQuestionIdRef = useRef<number | null>(null);
  const activeSectionIdRef = useRef<number | null>(null);
  const pendingDoneAfterRevealKeyRef = useRef<string | null>(null);
  const doneNavigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const returnToBoardRef = useRef<() => void>(() => {});
  const micShortcutGuardsRef = useRef({
    speechSupported: false,
    isRecording: false,
    composerLocked: false,
  });

  const active = useMemo(
    () => getQuestionById(state.activeQuestionId ?? 1),
    [state.activeQuestionId]
  );
  const question = active?.question;
  const section = active?.section;
  const messages = useMemo(
    () => (question ? (state.conversations[question.id] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES),
    [question, state.conversations]
  );
  const sphereState: SphereProps["state"] = isThinking
    ? "thinking"
    : isGuideSpeaking
      ? "speaking"
      : "listening";

  const isInputLockedForReveal = guideReveal !== null;
  const composerLocked =
    isThinking || isInputLockedForReveal || doneWithQuestionFlowActive;
  const showDoneWithQuestionButton =
    !doneWithQuestionFlowActive &&
    !isInputLockedForReveal &&
    !isThinking &&
    !isRecording;

  micShortcutGuardsRef.current = { speechSupported, isRecording, composerLocked };

  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionAvailable());
  }, []);

  useEffect(() => {
    void updateSession(state.sessionId, { current_screen: "conversation" });
  }, [state.sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [isThinking, messages.length, guideReveal?.count]);

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

  const stopSpeechRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const startSpeechRecognition = useCallback(() => {
    if (
      !speechSupported ||
      isThinking ||
      isInputLockedForReveal ||
      isRecording ||
      doneWithQuestionFlowActive
    )
      return;
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    speechExitModeRef.current = "none";
    snapshotBeforeMicRef.current = inputForMicRef.current;
    finalTranscriptRef.current = "";
    setIsRecording(true);

    const rec = new Ctor();
    recognitionRef.current = rec;
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (event: SpeechRecognitionResultEvent) => {
      let interim = "";
      let finals = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finals += result[0]?.transcript ?? "";
        } else {
          interim += result[0]?.transcript ?? "";
        }
      }
      finalTranscriptRef.current = finals;
      const live = `${finals}${interim}`.trim();
      setInput(live);
    };

    rec.onerror = () => {
      speechExitModeRef.current = "error";
      try {
        rec.stop();
      } catch {
        setIsRecording(false);
        recognitionRef.current = null;
        speechExitModeRef.current = "none";
        finalTranscriptRef.current = "";
        setInput(snapshotBeforeMicRef.current ?? "");
        snapshotBeforeMicRef.current = null;
      }
    };

    rec.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
      const mode = speechExitModeRef.current;
      speechExitModeRef.current = "none";
      if (mode === "escape" || mode === "error") {
        finalTranscriptRef.current = "";
        setInput(snapshotBeforeMicRef.current ?? "");
        snapshotBeforeMicRef.current = null;
        return;
      }
      const finalText = finalTranscriptRef.current.trim();
      setInput(finalText);
      snapshotBeforeMicRef.current = null;
    };

    try {
      rec.start();
    } catch (err) {
      console.error("[Conversation] SpeechRecognition.start() failed:", err);
      setIsRecording(false);
      recognitionRef.current = null;
      speechExitModeRef.current = "none";
      finalTranscriptRef.current = "";
      setInput(snapshotBeforeMicRef.current ?? "");
      snapshotBeforeMicRef.current = null;
    }
  }, [speechSupported, isThinking, isInputLockedForReveal, isRecording, doneWithQuestionFlowActive]);

  const startSpeechRecognitionRef = useRef(startSpeechRecognition);
  startSpeechRecognitionRef.current = startSpeechRecognition;

  useEffect(() => {
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key !== " ") return;
      const g = micShortcutGuardsRef.current;
      if (!g.speechSupported || g.isRecording || g.composerLocked) return;
      if (event.repeat || event.isComposing) return;
      if (document.activeElement === inputRef.current) return;
      event.preventDefault();
      startSpeechRecognitionRef.current();
    };
    document.addEventListener("keydown", onDocumentKeyDown);
    return () => document.removeEventListener("keydown", onDocumentKeyDown);
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      speechExitModeRef.current = "escape";
      finalTranscriptRef.current = "";
      stopSpeechRecognition();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isRecording, stopSpeechRecognition]);

  if (!question || !section) {
    return null;
  }

  const activeQuestion = question;
  const activeSection = section;
  activeQuestionIdRef.current = activeQuestion.id;
  activeSectionIdRef.current = activeSection.id;

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
      !state.sessionId
    ) {
      return;
    }
    const doneText = t("doneWithQuestion");
    setError(null);
    setDoneWithQuestionFlowActive(true);
    if (isRecording) stopSpeechRecognition();

    setIsThinking(true);

    const currentMessages = state.conversations[activeQuestion.id] ?? messages;
    const userMessage = createMessage("user", doneText);
    dispatch({ type: "ADD_MESSAGE", questionId: activeQuestion.id, message: userMessage });

    try {
      const response = await sendChatMessage({
        questionId: activeQuestion.id,
        questionText: activeQuestion.text,
        sectionTheme: activeSection.theme,
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
    if (qId == null || secId == null || !s.sessionId) return;

    const answeredQuestionIds = Array.from(new Set([...s.answeredQuestions, qId]));
    const currentConversation = s.conversations[qId] ?? EMPTY_MESSAGES;
    void logEvent(s.sessionId, EVENTS.QUESTION_ANSWERED, {
      questionId: qId,
      sectionId: secId,
      messageCount: currentConversation.length,
    });
    void updateSession(s.sessionId, {
      answered_question_ids: answeredQuestionIds,
      conversations: s.conversations as unknown as Json,
    });

    dispatch({ type: "MARK_QUESTION_ANSWERED", id: qId });
    dispatch({ type: "SET_ACTIVE_QUESTION", id: null });
    dispatch({ type: "GO_TO", screen: "board" });
  }

  returnToBoardRef.current = returnToBoard;

  function onMicClick() {
    if (isRecording) {
      stopSpeechRecognition();
      return;
    }
    startSpeechRecognition();
  }

  return (
    <section className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col px-5 py-8 text-center sm:px-8">
      <Button
        type="button"
        variant="ghost"
        onClick={returnToBoard}
        className="absolute top-5 left-5 h-10 rounded-full border border-[#D5DCE6] bg-transparent px-4 text-[#5A6B82] hover:border-[#1B3DD4] hover:bg-white hover:text-[#1B3DD4] sm:top-8 sm:left-8"
      >
        {t("back")}
      </Button>

      <div className="m-auto flex min-h-[calc(100vh-64px)] w-full max-w-3xl flex-col pt-16">
        <div className="flex flex-col items-center text-center">
          <p className="max-w-xl text-[15px] leading-[1.65] font-medium text-[#0F1B2D]">
            {activeQuestion.text}
          </p>
          <div className="mt-6">
            <Sphere state={sphereState} size={80} />
          </div>
        </div>

        <div
          ref={scrollRef}
          className="mt-8 flex-1 space-y-5 overflow-y-auto rounded-2xl border border-[#D5DCE6] bg-white/70 p-5 text-left"
        >
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`}>
              <p
                className={`mb-1 text-[12px] font-medium ${message.role === "user" ? "text-[#1B3DD4]" : "text-[#7B8FA8]"}`}
              >
                {message.role === "user" ? t("you") : t("guide")}
              </p>
              <p className="text-[15px] leading-[1.65] text-[#0F1B2D]">
                {guideDisplayText(message, index)}
              </p>
            </div>
          ))}
          {isThinking ? (
            <div>
              <p className="mb-1 text-[12px] font-medium text-[#7B8FA8]">{t("guide")}</p>
              <p className="text-[15px] leading-[1.65] text-[#0F1B2D]">...</p>
            </div>
          ) : null}
        </div>

        {error ? <p className="mt-4 max-w-md text-sm leading-6 text-[#D85A30]">{error}</p> : null}

        <div
          className={cn(
            "mt-5 text-left transition-opacity",
            composerLocked && "pointer-events-none opacity-50"
          )}
        >
          {showDoneWithQuestionButton ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => void submitDoneWithQuestion()}
              className="mb-3 h-9 rounded-full border border-[#D5DCE6] bg-transparent px-4 text-[13px] font-medium text-[#5A6B82] hover:bg-white hover:text-[#5A6B82]"
            >
              {t("doneWithQuestion")}
            </Button>
          ) : null}
          <form onSubmit={submitMessage} className="flex flex-col gap-1">
            <div className="flex gap-3">
              <Input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t("placeholder")}
                disabled={composerLocked}
                className={cn(
                  "h-12 rounded-full border-[#D5DCE6] bg-white px-5 shadow-none placeholder:text-[#7B8FA8] focus-visible:border-[#1B3DD4] focus-visible:ring-[#1B3DD4]/15",
                  isRecording
                    ? "italic text-[#7B8FA8]"
                    : "text-[#0F1B2D] not-italic"
                )}
              />
              {speechSupported ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={composerLocked}
                  onClick={onMicClick}
                  aria-label={isRecording ? t("micRecording") : t("micStart")}
                  className={cn(
                    "h-12 w-12 shrink-0 rounded-full p-0 shadow-none",
                    isRecording
                      ? "animate-pulse border-transparent bg-[#EF4444] text-white hover:bg-[#EF4444] hover:text-white"
                      : "border-[#D5DCE6] bg-white text-[#5A6B82] hover:bg-white hover:text-[#1B3DD4]"
                  )}
                >
                  <Iconify icon="lucide:mic" className="mx-auto size-5" />
                </Button>
              ) : null}
              <Button
                type="submit"
                disabled={!input.trim() || composerLocked}
                className="h-12 rounded-full bg-[#1B3DD4] px-7 text-white transition-all hover:-translate-y-px hover:bg-[#1632B0] active:scale-[0.98]"
              >
                {t("send")}
              </Button>
            </div>
            {isRecording ? (
              <p className="ps-5 text-[12px] leading-snug text-[#5A6B82]">{t("listeningHint")}</p>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
