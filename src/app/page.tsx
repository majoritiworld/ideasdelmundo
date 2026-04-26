"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { JourneyProvider, useJourney } from "@/lib/journey-context";
import Welcome from "@/components/screens/Welcome";
import Intake from "@/components/screens/Intake";
import MeetGuide from "@/components/screens/MeetGuide";
import Board from "@/components/screens/Board";
import Conversation from "@/components/screens/Conversation";
import Meditation from "@/components/screens/Meditation";
import EndCapture from "@/components/screens/EndCapture";
import ThankYou from "@/components/screens/ThankYou";
import API_ROUTES from "@/constants/api-routes.constants";
import { EVENTS } from "@/lib/events";
import { createSession, logEvent } from "@/lib/tracking";

const screenComponents = {
  welcome: Welcome,
  intake: Intake,
  meet: MeetGuide,
  board: Board,
  conv: Conversation,
  meditation: Meditation,
  end: EndCapture,
  thanks: ThankYou,
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
      if (!state.sessionId || state.screen === "thanks") return;

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
