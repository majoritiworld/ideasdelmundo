"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { JourneyProvider, useJourney, type Screen } from "@/lib/journey-context";
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
import { getStorage, removeStorage } from "@/hooks/use-local-storage";
import type { SessionRow } from "@/lib/supabase/types";

const RESUME_SESSION_STORAGE_KEY = "resumeSession";

const screenComponents = {
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
  const Screen = screenComponents[state.screen];

  useEffect(() => {
    const saved = getStorage(RESUME_SESSION_STORAGE_KEY) as SessionRow | null;
    if (!saved) return;

    dispatch({ type: "REHYDRATE", session: saved });
    removeStorage(RESUME_SESSION_STORAGE_KEY);
  }, [dispatch]);

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
