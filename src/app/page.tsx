"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { JourneyProvider, useJourney } from "@/lib/journey-context";
import Welcome from "@/components/screens/Welcome";
import MeetGuide from "@/components/screens/MeetGuide";
import BreathingOffer from "@/components/screens/BreathingOffer";
import PostMeditation from "@/components/screens/PostMeditation";
import QuestionsIntro from "@/components/screens/QuestionsIntro";
import Board from "@/components/screens/Board";
import Conversation from "@/components/screens/Conversation";
import Meditation from "@/components/screens/Meditation";
import Closing from "@/components/screens/Closing";
import API_ROUTES from "@/constants/api-routes.constants";
import { EVENTS } from "@/lib/events";
import { createSession, logEvent } from "@/lib/tracking";

const screenComponents = {
  welcome: Welcome,
  meet_guide: MeetGuide,
  breathing_offer: BreathingOffer,
  meditation: Meditation,
  post_meditation: PostMeditation,
  questions_intro: QuestionsIntro,
  board: Board,
  conversation: Conversation,
  closing: Closing,
};

function JourneyShell() {
  const { state, dispatch } = useJourney();
  const sessionInitStarted = useRef(false);
  const Screen = screenComponents[state.screen];

  useEffect(() => {
    if (sessionInitStarted.current || state.sessionId) return;
    sessionInitStarted.current = true;

    void (async () => {
      const id = await createSession({
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      });

      if (id) {
        dispatch({ type: "SET_SESSION_ID", id });
        void logEvent(id, EVENTS.SESSION_STARTED);
      }
    })();
  }, [dispatch, state.sessionId]);

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
