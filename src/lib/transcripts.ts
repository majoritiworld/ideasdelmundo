import { getQuestionById } from "@/lib/sections";
import type { Json, SessionRow, TranscriptMessageRow, TranscriptRole } from "@/lib/supabase/types";

export type TranscriptMessageForDisplay = Pick<
  TranscriptMessageRow,
  "id" | "session_id" | "card_id" | "role" | "content" | "sequence" | "metadata" | "created_at"
>;

type StoredConversationMessage = {
  role: TranscriptRole;
  text: string;
  timestamp: string | null;
};

function isRecord(value: Json | undefined): value is Record<string, Json | undefined> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parseStoredConversationMessage(value: Json | undefined): StoredConversationMessage | null {
  if (!isRecord(value)) return null;

  const role = value.role;
  const text = value.text;
  const timestamp = value.timestamp;

  if ((role !== "guide" && role !== "user") || typeof text !== "string") return null;

  return {
    role,
    text,
    timestamp: typeof timestamp === "string" ? timestamp : null,
  };
}

export function getTranscriptMessagesFromSession(
  session: SessionRow
): TranscriptMessageForDisplay[] {
  const conversations = session.conversations;
  if (!isRecord(conversations)) return [];

  let sequence = 0;

  return Object.entries(conversations)
    .flatMap(([questionIdValue, messages]) => {
      const questionId = Number(questionIdValue);
      if (!Number.isFinite(questionId) || !Array.isArray(messages)) return [];

      return messages
        .map((message) => parseStoredConversationMessage(message))
        .filter((message): message is StoredConversationMessage => Boolean(message))
        .map((message, index) => ({
          id: `${session.id}-${questionId}-${index}`,
          session_id: session.id,
          card_id: questionId,
          role: message.role,
          content: message.text,
          sequence: sequence++,
          metadata: {},
          created_at: message.timestamp,
        }));
    })
    .sort((a, b) => a.sequence - b.sequence);
}

export function getTranscriptMessagesForSession(
  session: SessionRow,
  transcriptMessages: TranscriptMessageForDisplay[]
) {
  if (transcriptMessages.length > 0) return transcriptMessages;

  return getTranscriptMessagesFromSession(session);
}

function formatDate(value: string | null) {
  if (!value) return "Unknown";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatTranscriptText(
  session: SessionRow,
  messages: TranscriptMessageForDisplay[]
) {
  const participant = session.name || session.email || "Anonymous";
  const lines = [
    "Majoriti Purpose Blueprint Transcript",
    "",
    `Participant: ${participant}`,
    `Email: ${session.email || "Not provided"}`,
    `Session: ${session.id}`,
    `Status: ${session.status}`,
    `Created: ${formatDate(session.created_at)}`,
    "",
  ];

  if (messages.length === 0) {
    lines.push("No transcript messages were captured.");
    return lines.join("\n");
  }

  let previousQuestionId: number | null = null;

  messages.forEach((message) => {
    if (message.card_id && message.card_id !== previousQuestionId) {
      const questionContext = getQuestionById(message.card_id);
      lines.push("");
      lines.push(
        questionContext
          ? `Question ${message.card_id}: ${questionContext.question.text}`
          : `Question ${message.card_id}`
      );
      lines.push("");
      previousQuestionId = message.card_id;
    }

    lines.push(`${message.role === "user" ? "User" : "Guide"}: ${message.content}`);
    lines.push("");
  });

  return lines.join("\n").trimEnd() + "\n";
}

export function getTranscriptFileName(session: SessionRow) {
  const label = session.name || session.email || session.id;

  return `${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-transcript.txt`;
}
