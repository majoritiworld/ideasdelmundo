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
  conversationHistory: ChatHistoryMessage[];
  userMessage: string;
  sessionId: string;
}

export async function sendChatMessage(payload: SendChatMessagePayload): Promise<string> {
  const response = await fetch(API_ROUTES.CHAT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as { message?: string; error?: string };

  if (!response.ok || !data.message) {
    throw new Error(data.error ?? "Unable to get a guide response");
  }

  return data.message;
}
