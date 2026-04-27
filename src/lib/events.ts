export const EVENTS = {
  SESSION_STARTED: "session_started",
  WELCOME_CTA_CLICKED: "welcome_cta_clicked",
  MEET_GUIDE_VIEWED: "meet_guide_viewed",
  BOARD_VIEWED: "board_viewed",
  BREATHING_OFFERED: "breathing_offered",
  MEDITATION_STARTED: "meditation_started",
  MEDITATION_COMPLETED: "meditation_completed",
  MEDITATION_SKIPPED: "meditation_skipped",
  QUESTION_OPENED: "question_opened",
  QUESTION_ANSWERED: "question_answered",
  SECTION_COMPLETED: "section_completed",
  AI_RESPONSE_RECEIVED: "ai_response_received",
  SESSION_COMPLETED: "session_completed",
} as const;

export type EventType = (typeof EVENTS)[keyof typeof EVENTS];
