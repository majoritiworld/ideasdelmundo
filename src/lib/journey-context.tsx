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
import { sections } from "@/lib/sections";
import type { SessionRow } from "@/lib/supabase/types";

export type Screen =
  | "welcome"
  | "start"
  | "meet_guide"
  | "breathing_offer"
  | "meditation"
  | "post_meditation"
  | "questions_intro"
  | "section_intro"
  | "conversation"
  | "closing"
  | "deep_dive";

export interface ConversationMessage {
  role: "guide" | "user";
  text: string;
  timestamp: string;
}

export type ModerationStatus = "active" | "warned" | "terminated";

export interface ModerationState {
  strikes: number;
  status: ModerationStatus;
  terminationReason?: string;
}

export interface JourneyState {
  screen: Screen;
  sessionId: string | null;
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
  archetypeName: string | null;
  seenPauseHint: boolean;
  moderation: ModerationState;
}

type JourneyAction =
  | { type: "GO_TO"; screen: Screen }
  | { type: "SET_SESSION_ID"; id: string }
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
  | { type: "SET_ARCHETYPE"; archetypeName: string }
  | { type: "MARK_PAUSE_HINT_SEEN" }
  | { type: "SYNC_MODERATION"; moderation: ModerationState }
  | { type: "RECORD_STRIKE"; reason?: string }
  | { type: "TERMINATE_SESSION"; reason?: string }
  | { type: "REHYDRATE"; session: SessionRow }
  | { type: "RESET" };

const initialState: JourneyState = {
  screen: "welcome",
  sessionId: null,
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
  archetypeName: null,
  seenPauseHint: false,
  moderation: { strikes: 0, status: "active" },
};

function isScreen(value: string | null): value is Screen {
  return Boolean(
    value &&
      [
        "welcome",
        "start",
        "meet_guide",
        "breathing_offer",
        "meditation",
        "post_meditation",
        "questions_intro",
        "section_intro",
        "conversation",
        "closing",
        "deep_dive",
      ].includes(value)
  );
}

const LEGACY_SCREEN_MAP: Record<string, Screen> = {
  board: "section_intro",
  optional_board: "deep_dive",
};

function resolveRehydratedScreen(value: string | null): Screen {
  if (isScreen(value)) return value;
  if (value && value in LEGACY_SCREEN_MAP) return LEGACY_SCREEN_MAP[value];
  return "welcome";
}

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
      return {
        ...state,
        currentSection: Math.max(1, Math.min(sections.length, action.sectionId)),
      };
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
    case "SET_ARCHETYPE":
      return { ...state, archetypeName: action.archetypeName };
    case "MARK_PAUSE_HINT_SEEN":
      if (state.seenPauseHint) return state;
      return { ...state, seenPauseHint: true };
    case "SYNC_MODERATION":
      return { ...state, moderation: action.moderation };
    case "RECORD_STRIKE": {
      const strikes = state.moderation.strikes + 1;
      const status: ModerationStatus = strikes >= 2 ? "terminated" : "warned";
      return {
        ...state,
        moderation: {
          strikes,
          status,
          terminationReason:
            status === "terminated" ? (action.reason ?? state.moderation.terminationReason) : state.moderation.terminationReason,
        },
      };
    }
    case "TERMINATE_SESSION":
      return {
        ...state,
        moderation: {
          ...state.moderation,
          status: "terminated",
          terminationReason: action.reason ?? state.moderation.terminationReason,
        },
      };
    case "REHYDRATE": {
      const session = action.session;
      const strikes = session.moderation_strikes ?? 0;
      const moderationStatus: ModerationStatus =
        session.status === "terminated" || strikes >= 2
          ? "terminated"
          : strikes === 1
            ? "warned"
            : "active";

      return {
        ...state,
        sessionId: session.id,
        name: session.name ?? "",
        email: session.email ?? "",
        source: session.source ?? "",
        currentSection: session.current_section ?? 1,
        answeredQuestions: session.answered_question_ids ?? [],
        coreAnswered: session.core_answered ?? [],
        conversations: (session.conversations ?? {}) as unknown as Record<number, ConversationMessage[]>,
        meditationCompleted: session.meditation_completed ?? false,
        seenPauseHint: session.seen_pause_hint ?? false,
        screen: resolveRehydratedScreen(session.current_screen),
        activeQuestionId: null,
        moderation: {
          strikes,
          status: moderationStatus,
          terminationReason: session.termination_reason ?? undefined,
        },
      };
    }
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

export function isSessionTerminated(state: JourneyState) {
  return state.moderation.status === "terminated";
}

export function useLogEventOnce(eventType: EventType) {
  const { state, dispatch } = useJourney();

  return useCallback(async () => {
    if (!state.sessionId || state.firedEvents.has(eventType)) return;

    await logEvent(state.sessionId, eventType);
    dispatch({ type: "MARK_EVENT_FIRED", eventType });
  }, [dispatch, eventType, state.firedEvents, state.sessionId]);
}
