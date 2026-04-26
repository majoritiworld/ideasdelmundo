export const EVENTS = {
  SESSION_STARTED: "session_started",
  WELCOME_CTA_CLICKED: "welcome_cta_clicked",
  INTRO_VIDEO_PLAYED: "intro_video_played",
  INTAKE_VIEWED: "intake_viewed",
  INTAKE_NAME_ENTERED: "intake_name_entered",
  INTAKE_EMAIL_ENTERED: "intake_email_entered",
  INTAKE_SUBMITTED: "intake_submitted",
  MEET_GUIDE_VIEWED: "meet_guide_viewed",
  BOARD_VIEWED: "board_viewed",
  CARD_OPENED: "card_opened",
  VOICE_CONVERSATION_STARTED: "voice_conversation_started",
  VOICE_CONVERSATION_ENDED: "voice_conversation_ended",
  CARD_COMPLETED: "card_completed",
  MEDITATION_STARTED: "meditation_started",
  MEDITATION_ENDED: "meditation_ended",
  END_CAPTURE_VIEWED: "end_capture_viewed",
  SOURCE_SELECTED: "source_selected",
  SESSION_COMPLETED: "session_completed",
  THANKS_VIEWED: "thanks_viewed",
} as const;

export type EventType = (typeof EVENTS)[keyof typeof EVENTS];
