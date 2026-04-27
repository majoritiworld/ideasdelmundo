"use client";

import API_ROUTES from "@/constants/api-routes.constants";
import type { EventType } from "@/lib/events";
import type {
  Json,
  SessionInsert,
  SessionUpdate,
  TranscriptMessageInsert,
} from "@/lib/supabase/types";

function getErrorDetails(err: unknown) {
  if (err instanceof Error) return err.message;
  return err;
}

async function postTracking<T>(body: Record<string, unknown>): Promise<T | null> {
  const response = await fetch(API_ROUTES.TRACKING.WRITE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as T & { ok?: boolean; error?: string };

  if (!response.ok || data.ok === false) {
    throw new Error(data.error ?? "Tracking request failed");
  }

  return data;
}

export async function createSession(fields: SessionInsert = {}): Promise<string | null> {
  try {
    const data = await postTracking<{ id: string }>({
      action: "createSession",
      fields,
    });

    return data?.id ?? null;
  } catch (err) {
    console.error("[tracking] createSession failed", getErrorDetails(err));
    return null;
  }
}

export async function updateSession(id: string | null, fields: SessionUpdate): Promise<void> {
  if (!id) return;

  try {
    await postTracking({
      action: "updateSession",
      sessionId: id,
      fields,
    });
  } catch (err) {
    console.error("[tracking] updateSession failed", getErrorDetails(err));
  }
}

export async function logEvent(
  sessionId: string | null,
  eventType: EventType,
  metadata: Record<string, Json | undefined> = {}
): Promise<void> {
  if (!sessionId) return;

  try {
    await postTracking({
      action: "logEvent",
      sessionId,
      eventType,
      metadata,
    });
  } catch (err) {
    console.error("[tracking] logEvent failed", getErrorDetails(err));
  }
}

export async function logTranscriptMessage(
  sessionId: string | null,
  message: Omit<TranscriptMessageInsert, "session_id">
): Promise<void> {
  if (!sessionId) return;

  try {
    await postTracking({
      action: "logTranscriptMessage",
      sessionId,
      message,
    });
  } catch (err) {
    console.error("[tracking] logTranscriptMessage failed", getErrorDetails(err));
  }
}

export async function markCompleted(id: string | null): Promise<void> {
  await updateSession(id, {
    status: "completed",
    completed_at: new Date().toISOString(),
  });
}
