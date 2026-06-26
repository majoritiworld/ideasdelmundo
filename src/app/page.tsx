"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { JourneyProvider, useJourney, type Screen } from "@/lib/journey-context";
import Welcome from "@/components/screens/Welcome";
import Start from "@/components/screens/Start";
import MeetGuide from "@/components/screens/MeetGuide";
import BreathingOffer from "@/components/screens/BreathingOffer";
import PostMeditation from "@/components/screens/PostMeditation";
import QuestionsIntro from "@/components/screens/QuestionsIntro";
import SectionIntro from "@/components/screens/SectionIntro";
import Conversation from "@/components/screens/Conversation";
import DeepDive from "@/components/screens/DeepDive";
import Meditation from "@/components/screens/Meditation";
import Closing from "@/components/screens/Closing";
import API_ROUTES from "@/constants/api-routes.constants";
import { getStorage, removeStorage } from "@/hooks/use-local-storage";
import { getQuestionById, sections } from "@/lib/sections";
import type { SessionRow } from "@/lib/supabase/types";

const RESUME_SESSION_STORAGE_KEY = "resumeSession";

const screenComponents = {
  welcome: Welcome,
  start: Start,
  meet_guide: MeetGuide,
  breathing_offer: BreathingOffer,
  meditation: Meditation,
  post_meditation: PostMeditation,
  questions_intro: QuestionsIntro,
  section_intro: SectionIntro,
  conversation: Conversation,
  closing: Closing,
  deep_dive: DeepDive,
};

function isPreviewScreen(value: string | null): value is Screen {
  return Boolean(value && value in screenComponents);
}

function parsePreviewSection(value: string | null): number | null {
  if (!value) return null;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > sections.length) return null;

  return parsed;
}

function parsePreviewQuestion(value: string | null): number | null {
  if (!value) return null;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || !getQuestionById(parsed)) return null;

  return parsed;
}

function isLocalDevHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function JourneyShell() {
  const { state, dispatch } = useJourney();
  const Screen = screenComponents[state.screen];

  useEffect(() => {
    const saved = getStorage(RESUME_SESSION_STORAGE_KEY) as SessionRow | null;
    if (!saved) return;

    dispatch({ type: "REHYDRATE", session: saved });
    removeStorage(RESUME_SESSION_STORAGE_KEY);
  }, [dispatch]);

  useEffect(() => {
    if (getStorage(RESUME_SESSION_STORAGE_KEY)) return;

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("start") === null) return;

    dispatch({ type: "GO_TO", screen: "start" });
  }, [dispatch]);

  useEffect(() => {
    if (!isLocalDevHost(window.location.hostname)) return;

    const searchParams = new URLSearchParams(window.location.search);
    const screen = searchParams.get("screen");
    const name = searchParams.get("name");
    const sectionId = parsePreviewSection(searchParams.get("section"));
    const questionId = parsePreviewQuestion(searchParams.get("question"));

    if (!isPreviewScreen(screen)) return;

    if (name) dispatch({ type: "SET_NAME", name });

    if (sectionId !== null) {
      dispatch({ type: "SET_CURRENT_SECTION", sectionId });
    }

    if (questionId !== null) {
      const match = getQuestionById(questionId);
      if (match && sectionId === null) {
        dispatch({ type: "SET_CURRENT_SECTION", sectionId: match.section.id });
      }
      dispatch({ type: "SET_ACTIVE_QUESTION", id: questionId });
    } else if (screen === "conversation" && sectionId !== null) {
      const section = sections.find((item) => item.id === sectionId);
      if (section) {
        dispatch({ type: "SET_ACTIVE_QUESTION", id: section.coreQuestion.id });
      }
    }

    dispatch({ type: "GO_TO", screen });
  }, [dispatch]);

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
          className="flex min-h-screen w-full justify-center"
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
