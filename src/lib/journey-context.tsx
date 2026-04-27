"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

import type { EventType } from "@/lib/events";
import { logEvent } from "@/lib/tracking";

export type Screen =
  | "welcome"
  | "meet_guide"
  | "breathing_offer"
  | "meditation"
  | "post_meditation"
  | "questions_intro"
  | "board"
  | "conversation"
  | "closing";

export interface ConversationMessage {
  role: "guide" | "user";
  text: string;
  timestamp: string;
}

export interface JourneyState {
  screen: Screen;
  sessionId: string | null;
  firedEvents: Set<EventType>;
  name: string;
  email: string;
  source: string;
  currentSection: number;
  answeredQuestions: number[];
  activeQuestionId: number | null;
  conversations: Record<number, ConversationMessage[]>;
  meditationCompleted: boolean;
}

type JourneyAction =
  | { type: "GO_TO"; screen: Screen }
  | { type: "SET_SESSION_ID"; id: string }
  | { type: "MARK_EVENT_FIRED"; eventType: EventType }
  | { type: "SET_NAME"; name: string }
  | { type: "SET_EMAIL"; email: string }
  | { type: "SET_SOURCE"; source: string }
  | { type: "SET_CURRENT_SECTION"; section: number }
  | { type: "SET_ACTIVE_QUESTION"; id: number | null }
  | { type: "MARK_QUESTION_ANSWERED"; id: number }
  | { type: "ADD_MESSAGE"; questionId: number; message: ConversationMessage }
  | { type: "SET_MEDITATION_COMPLETED"; completed: boolean }
  | { type: "RESET" };

const initialState: JourneyState = {
  screen: "welcome",
  sessionId: null,
  firedEvents: new Set<EventType>(),
  name: "",
  email: "",
  source: "",
  currentSection: 1,
  answeredQuestions: [],
  activeQuestionId: null,
  conversations: {},
  meditationCompleted: false,
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
    case "SET_CURRENT_SECTION":
      return { ...state, currentSection: Math.max(1, Math.min(4, action.section)) };
    case "SET_ACTIVE_QUESTION":
      return { ...state, activeQuestionId: action.id };
    case "MARK_QUESTION_ANSWERED":
      if (state.answeredQuestions.includes(action.id)) return state;
      return { ...state, answeredQuestions: [...state.answeredQuestions, action.id] };
    case "ADD_MESSAGE":
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [action.questionId]: [...(state.conversations[action.questionId] ?? []), action.message],
        },
      };
    case "SET_MEDITATION_COMPLETED":
      return { ...state, meditationCompleted: action.completed };
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
