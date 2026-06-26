"use client";

import API_ROUTES from "@/constants/api-routes.constants";

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SendChatMessagePayload {
  questionId: number;
  questionText: string;
  sectionTheme: string;
  isCore: boolean;
  conversationHistory: ChatHistoryMessage[];
  userMessage: string;
  sessionId: string | null;
  userMessageCount?: number;
  priorContext?: string;
}

export type ModerationStatus = "active" | "warned" | "terminated";

export interface ChatModeration {
  strike?: number;
  strikes?: number;
  status?: ModerationStatus;
}

export interface ChatResponse {
  message: string;
  terminated?: boolean;
  moderation?: ChatModeration;
}

export async function sendChatMessage(payload: SendChatMessagePayload): Promise<ChatResponse> {
  const response = await fetch(API_ROUTES.CHAT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as {
    message?: string;
    error?: string;
    terminated?: boolean;
    moderation?: ChatModeration;
  };

  if (!response.ok || !data.message) {
    throw new Error(data.error ?? "Unable to get a guide response");
  }

  return {
    message: data.message,
    terminated: data.terminated,
    moderation: data.moderation,
  };
}
