"use client";

import API_ROUTES from "@/constants/api-routes.constants";

export interface NotifyPayload {
  sessionId: string | null;
  name?: string;
  email?: string;
}

export async function sendNotifyEmail(payload: NotifyPayload): Promise<void> {
  const response = await fetch(API_ROUTES.NOTIFY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as { ok?: boolean; error?: string };

  if (!response.ok || data.ok === false) {
    throw new Error(data.error ?? "Notification request failed");
  }
}
