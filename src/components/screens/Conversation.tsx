"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sphere, { type SphereProps } from "@/components/Sphere";
import { sendChatMessage } from "@/lib/chat";
import { EVENTS } from "@/lib/events";
import { type ConversationMessage, useJourney } from "@/lib/journey-context";
import { getQuestionById } from "@/lib/sections";
import type { Json } from "@/lib/supabase/types";
import { logEvent, updateSession } from "@/lib/tracking";

function createMessage(role: ConversationMessage["role"], text: string): ConversationMessage {
  return {
    role,
    text,
    timestamp: new Date().toISOString(),
  };
}

export default function Conversation() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.conversation");
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isGuideSpeaking, setIsGuideSpeaking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const initializedQuestionId = useRef<number | null>(null);
  const active = useMemo(
    () => getQuestionById(state.activeQuestionId ?? 1),
    [state.activeQuestionId]
  );
  const question = active?.question;
  const section = active?.section;
  const messages = question ? (state.conversations[question.id] ?? []) : [];
  const sphereState: SphereProps["state"] = isThinking
    ? "thinking"
    : isGuideSpeaking
      ? "speaking"
      : "listening";

  useEffect(() => {
    void updateSession(state.sessionId, { current_screen: "conversation" });
  }, [state.sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [isThinking, messages.length]);

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

  if (!question || !section) {
    return null;
  }

  const activeQuestion = question;
  const activeSection = section;

  async function submitMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || isThinking || !state.sessionId) return;

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

  function returnToBoard() {
    const answeredQuestionIds = Array.from(
      new Set([...state.answeredQuestions, activeQuestion.id])
    );
    const currentConversation = state.conversations[activeQuestion.id] ?? messages;
    void logEvent(state.sessionId, EVENTS.QUESTION_ANSWERED, {
      questionId: activeQuestion.id,
      sectionId: activeSection.id,
      messageCount: currentConversation.length,
    });
    void updateSession(state.sessionId, {
      answered_question_ids: answeredQuestionIds,
      conversations: state.conversations as unknown as Json,
    });

    dispatch({ type: "MARK_QUESTION_ANSWERED", id: activeQuestion.id });
    dispatch({ type: "SET_ACTIVE_QUESTION", id: null });
    dispatch({ type: "GO_TO", screen: "board" });
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
              <p className="text-[15px] leading-[1.65] text-[#0F1B2D]">{message.text}</p>
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

        <form onSubmit={submitMessage} className="mt-5 flex gap-3">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t("placeholder")}
            className="h-12 rounded-full border-[#D5DCE6] bg-white px-5 text-[#0F1B2D] shadow-none placeholder:text-[#7B8FA8] focus-visible:border-[#1B3DD4] focus-visible:ring-[#1B3DD4]/15"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="h-12 rounded-full bg-[#1B3DD4] px-7 text-white transition-all hover:-translate-y-px hover:bg-[#1632B0] active:scale-[0.98]"
          >
            {t("send")}
          </Button>
        </form>
      </div>
    </section>
  );
}
