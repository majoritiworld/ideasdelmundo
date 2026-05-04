"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Login from "@/components/screens/Login";
import {
  JourneyProvider,
  useJourney,
  type ConversationMessage,
  type ResumeJourneySnapshot,
  type Screen,
} from "@/lib/journey-context";
import Welcome from "@/components/screens/Welcome";
import MeetGuide from "@/components/screens/MeetGuide";
import BreathingOffer from "@/components/screens/BreathingOffer";
import PostMeditation from "@/components/screens/PostMeditation";
import QuestionsIntro from "@/components/screens/QuestionsIntro";
import SectionIntro from "@/components/screens/SectionIntro";
import Board from "@/components/screens/Board";
import OptionalBoard from "@/components/screens/OptionalBoard";
import Conversation from "@/components/screens/Conversation";
import Meditation from "@/components/screens/Meditation";
import Closing from "@/components/screens/Closing";
import API_ROUTES from "@/constants/api-routes.constants";
import { supabase } from "@/lib/supabase/client";
import type { Json, SessionRow } from "@/lib/supabase/types";

const resumableScreens = new Set<Screen>([
  "welcome",
  "meet_guide",
  "breathing_offer",
  "meditation",
  "post_meditation",
  "questions_intro",
  "section_intro",
  "board",
  "optional_board",
  "conversation",
]);

function isScreen(value: string | null): value is Screen {
  return Boolean(value && resumableScreens.has(value as Screen));
}

function parseConversations(value: Json | null): Record<number, ConversationMessage[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.entries(value).reduce<Record<number, ConversationMessage[]>>(
    (acc, [key, messages]) => {
      const questionId = Number(key);
      if (!Number.isFinite(questionId) || !Array.isArray(messages)) return acc;

      acc[questionId] = messages.reduce<ConversationMessage[]>((parsed, message) => {
        if (!message || typeof message !== "object" || Array.isArray(message)) return parsed;
        if (
          (message.role === "guide" || message.role === "user") &&
          typeof message.text === "string" &&
          typeof message.timestamp === "string"
        ) {
          parsed.push({
            role: message.role,
            text: message.text,
            timestamp: message.timestamp,
          });
        }

        return parsed;
      }, []);

      return acc;
    },
    {}
  );
}

function toResumeSnapshot(session: SessionRow): ResumeJourneySnapshot {
  const conversations = parseConversations(session.conversations);
  const conversationQuestionIds = Object.keys(conversations).map(Number).filter(Number.isFinite);
  const activeQuestionId = conversationQuestionIds.at(-1) ?? null;
  const screen = isScreen(session.current_screen) ? session.current_screen : "welcome";

  return {
    sessionId: session.id,
    screen: screen === "conversation" && activeQuestionId === null ? "board" : screen,
    name: session.name ?? "",
    email: session.email ?? "",
    currentSection: session.current_section ?? 1,
    activeQuestionId,
    answeredQuestions: session.answered_question_ids ?? [],
    conversations,
    meditationCompleted: session.meditation_completed ?? false,
  };
}

const screenComponents = {
  login: Login,
  welcome: Welcome,
  meet_guide: MeetGuide,
  breathing_offer: BreathingOffer,
  meditation: Meditation,
  post_meditation: PostMeditation,
  questions_intro: QuestionsIntro,
  section_intro: SectionIntro,
  board: Board,
  optional_board: OptionalBoard,
  conversation: Conversation,
  closing: Closing,
};

function isPreviewScreen(value: string | null): value is Screen {
  return Boolean(value && value in screenComponents);
}

function JourneyShell() {
  const { state, dispatch } = useJourney();
  const resumeLookupUserId = useRef<string | null>(null);
  const Screen = screenComponents[state.screen];

  useEffect(() => {
    if (window.location.hostname !== "localhost") return;

    const searchParams = new URLSearchParams(window.location.search);
    const screen = searchParams.get("screen");
    const name = searchParams.get("name");

    if (!isPreviewScreen(screen)) return;
    if (name) dispatch({ type: "SET_NAME", name });
    dispatch({ type: "GO_TO", screen });
  }, [dispatch]);

  useEffect(() => {
    if (!state.authChecked) return;

    if (!state.userId) {
      resumeLookupUserId.current = null;
      dispatch({ type: "SET_RESUME_SESSION", session: null });
      return;
    }

    const userId = state.userId;
    if (resumeLookupUserId.current === userId) return;
    resumeLookupUserId.current = userId;

    void (async () => {
      const { data } = await supabase
        .from("sessions")
        .select(
          "id,status,current_screen,name,email,source,user_id,user_agent,referrer,visited_card_ids,cards_explored_count,conversations,current_section,answered_question_ids,meditation_completed,intake_completed_at,first_card_opened_at,completed_at,report_status,draft_report,report_generated_at,report_sent_at,created_at,updated_at"
        )
        .eq("user_id", userId)
        .neq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        dispatch({ type: "SET_RESUME_SESSION", session: toResumeSnapshot(data) });
        return;
      }

      dispatch({ type: "SET_RESUME_SESSION", session: null });
    })();
  }, [dispatch, state.authChecked, state.userId]);

  useEffect(() => {
    const handler = () => {
      if (!state.sessionId || state.screen === "closing") return;

      const blob = new Blob([JSON.stringify({ sessionId: state.sessionId })], {
        type: "application/json",
      });
      navigator.sendBeacon(API_ROUTES.TRACKING.ABANDON, blob);
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.screen, state.sessionId]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#FAFBFE]">
      <AnimatePresence mode="wait">
        <motion.div
          key={state.screen}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="min-h-screen"
        >
          <Screen />
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

export default function RootPage() {
  return (
    <JourneyProvider>
      <JourneyShell />
    </JourneyProvider>
  );
}
