"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

import type { EventType } from "@/lib/events";
import { supabase } from "@/lib/supabase/client";
import { logEvent } from "@/lib/tracking";

export type Screen =
  | "login"
  | "welcome"
  | "meet_guide"
  | "breathing_offer"
  | "meditation"
  | "post_meditation"
  | "questions_intro"
  | "section_intro"
  | "board"
  | "optional_board"
  | "conversation"
  | "closing";

export interface ConversationMessage {
  role: "guide" | "user";
  text: string;
  timestamp: string;
}

export interface ResumeJourneySnapshot {
  sessionId: string;
  screen: Screen;
  name: string;
  email: string;
  currentSection: number;
  activeQuestionId: number | null;
  answeredQuestions: number[];
  conversations: Record<number, ConversationMessage[]>;
  meditationCompleted: boolean;
}

export interface JourneyState {
  screen: Screen;
  sessionId: string | null;
  userId: string | null;
  authChecked: boolean;
  resumeLookupChecked: boolean;
  resumeSession: ResumeJourneySnapshot | null;
  firedEvents: Set<EventType>;
  name: string;
  email: string;
  source: string;
  currentSection: number;
  coreAnswered: number[];
  answeredQuestions: number[];
  sectionVoiceoversPlayed: number[];
  activeQuestionId: number | null;
  conversations: Record<number, ConversationMessage[]>;
  meditationCompleted: boolean;
}

type JourneyAction =
  | { type: "GO_TO"; screen: Screen }
  | { type: "SET_SESSION_ID"; id: string }
  | { type: "SET_USER"; userId: string | null }
  | { type: "SET_AUTH_CHECKED"; checked: boolean }
  | { type: "SET_RESUME_SESSION"; session: ResumeJourneySnapshot | null }
  | { type: "HYDRATE_RESUME"; session: ResumeJourneySnapshot }
  | { type: "MARK_EVENT_FIRED"; eventType: EventType }
  | { type: "SET_NAME"; name: string }
  | { type: "SET_EMAIL"; email: string }
  | { type: "SET_SOURCE"; source: string }
  | { type: "SET_CURRENT_SECTION"; sectionId: number }
  | { type: "MARK_SECTION_VOICEOVER_PLAYED"; section: number }
  | { type: "SET_ACTIVE_QUESTION"; id: number | null }
  | { type: "MARK_CORE_ANSWERED"; sectionId: number }
  | { type: "MARK_QUESTION_ANSWERED"; id: number }
  | { type: "ADD_MESSAGE"; questionId: number; message: ConversationMessage }
  | { type: "SET_MEDITATION_COMPLETED"; completed: boolean }
  | { type: "RESET" };

const initialState: JourneyState = {
  screen: "login",
  sessionId: null,
  userId: null,
  authChecked: false,
  resumeLookupChecked: false,
  resumeSession: null,
  firedEvents: new Set<EventType>(),
  name: "",
  email: "",
  source: "",
  currentSection: 1,
  coreAnswered: [],
  answeredQuestions: [],
  sectionVoiceoversPlayed: [],
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
    case "SET_USER":
      if (state.userId === action.userId) return state;
      return { ...state, userId: action.userId, resumeLookupChecked: false, resumeSession: null };
    case "SET_AUTH_CHECKED":
      return { ...state, authChecked: action.checked };
    case "SET_RESUME_SESSION":
      return { ...state, resumeSession: action.session, resumeLookupChecked: true };
    case "HYDRATE_RESUME":
      return {
        ...state,
        screen: action.session.screen,
        sessionId: action.session.sessionId,
        resumeSession: null,
        name: action.session.name,
        email: action.session.email,
        currentSection: action.session.currentSection,
        activeQuestionId: action.session.activeQuestionId,
        answeredQuestions: action.session.answeredQuestions,
        conversations: action.session.conversations,
        meditationCompleted: action.session.meditationCompleted,
      };
    case "MARK_EVENT_FIRED":
      return { ...state, firedEvents: new Set(state.firedEvents).add(action.eventType) };
    case "SET_NAME":
      return { ...state, name: action.name };
    case "SET_EMAIL":
      return { ...state, email: action.email };
    case "SET_SOURCE":
      return { ...state, source: action.source };
    case "SET_CURRENT_SECTION":
      return { ...state, currentSection: Math.max(1, Math.min(5, action.sectionId)) };
    case "MARK_SECTION_VOICEOVER_PLAYED":
      if (state.sectionVoiceoversPlayed.includes(action.section)) return state;
      return {
        ...state,
        sectionVoiceoversPlayed: [...state.sectionVoiceoversPlayed, action.section],
      };
    case "SET_ACTIVE_QUESTION":
      return { ...state, activeQuestionId: action.id };
    case "MARK_CORE_ANSWERED":
      if (state.coreAnswered.includes(action.sectionId)) return state;
      return { ...state, coreAnswered: [...state.coreAnswered, action.sectionId] };
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
      return {
        ...initialState,
        userId: state.userId,
        authChecked: state.authChecked,
      };
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

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      dispatch({ type: "SET_USER", userId: session?.user.id ?? null });
      dispatch({ type: "SET_AUTH_CHECKED", checked: true });
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch({ type: "SET_USER", userId: session?.user.id ?? null });
      dispatch({ type: "SET_AUTH_CHECKED", checked: true });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

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
