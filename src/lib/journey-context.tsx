"use client";

import { createContext, useCallback, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from "react";

import type { EventType } from "@/lib/events";
import { logEvent } from "@/lib/tracking";

export type Screen = "welcome" | "intake" | "meet" | "board" | "conv" | "meditation" | "end" | "thanks";

export interface TranscriptMessage {
  role: "guide" | "user";
  text: string;
}

export interface JourneyState {
  screen: Screen;
  sessionId: string | null;
  firedEvents: Set<EventType>;
  name: string;
  email: string;
  source: string;
  visitedCardIds: number[];
  activeCardId: number | null;
  activeCardOpenedAt: number | null;
  firstCardOpenedAt: string | null;
  transcript: TranscriptMessage[];
}

type JourneyAction =
  | { type: "GO_TO"; screen: Screen }
  | { type: "SET_SESSION_ID"; id: string }
  | { type: "MARK_EVENT_FIRED"; eventType: EventType }
  | { type: "SET_NAME"; name: string }
  | { type: "SET_EMAIL"; email: string }
  | { type: "SET_SOURCE"; source: string }
  | { type: "SET_ACTIVE_CARD"; id: number; openedAt?: number }
  | { type: "SET_FIRST_CARD_OPENED_AT"; timestamp: string }
  | { type: "MARK_VISITED"; id: number }
  | { type: "ADD_TRANSCRIPT_MESSAGE"; message: TranscriptMessage }
  | { type: "CLEAR_TRANSCRIPT" }
  | { type: "RESET" };

const initialState: JourneyState = {
  screen: "welcome",
  sessionId: null,
  firedEvents: new Set<EventType>(),
  name: "",
  email: "",
  source: "",
  visitedCardIds: [],
  activeCardId: null,
  activeCardOpenedAt: null,
  firstCardOpenedAt: null,
  transcript: [],
};

function journeyReducer(state: JourneyState, action: JourneyAction): JourneyState {
  switch (action.type) {
    case "GO_TO":
      return { ...state, screen: action.screen };
    case "SET_SESSION_ID":
      return { ...state, sessionId: action.id };
    case "MARK_EVENT_FIRED":
      return { ...state, firedEvents: new Set(state.firedEvents).add(action.eventType) };
    case "SET_NAME":
      return { ...state, name: action.name };
    case "SET_EMAIL":
      return { ...state, email: action.email };
    case "SET_SOURCE":
      return { ...state, source: action.source };
    case "SET_ACTIVE_CARD":
      return { ...state, activeCardId: action.id, activeCardOpenedAt: action.openedAt ?? Date.now() };
    case "SET_FIRST_CARD_OPENED_AT":
      return { ...state, firstCardOpenedAt: action.timestamp };
    case "MARK_VISITED":
      if (state.visitedCardIds.includes(action.id)) return state;
      return { ...state, visitedCardIds: [...state.visitedCardIds, action.id] };
    case "ADD_TRANSCRIPT_MESSAGE":
      return { ...state, transcript: [...state.transcript, action.message] };
    case "CLEAR_TRANSCRIPT":
      return { ...state, transcript: [] };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface JourneyContextValue {
  state: JourneyState;
  dispatch: Dispatch<JourneyAction>;
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(journeyReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const context = useContext(JourneyContext);

  if (!context) {
    throw new Error("useJourney must be used within JourneyProvider");
  }

  return context;
}

export function useLogEventOnce(eventType: EventType) {
  const { state, dispatch } = useJourney();

  return useCallback(async () => {
    if (!state.sessionId || state.firedEvents.has(eventType)) return;

    await logEvent(state.sessionId, eventType);
    dispatch({ type: "MARK_EVENT_FIRED", eventType });
  }, [dispatch, eventType, state.firedEvents, state.sessionId]);
}
