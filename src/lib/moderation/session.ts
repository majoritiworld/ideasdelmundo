import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { SessionRow } from "@/lib/supabase/types";

export type ModerationStatus = "active" | "warned" | "terminated";

export interface ModerationState {
  strikes: number;
  status: ModerationStatus;
  terminationReason?: string;
}

export interface ChatSessionRow {
  id: string;
  status: SessionRow["status"];
  moderation_strikes: number;
  termination_reason: string | null;
}

export async function loadSessionForChat(sessionId: string): Promise<ChatSessionRow | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("id, status, moderation_strikes, termination_reason")
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    status: data.status,
    moderation_strikes: data.moderation_strikes ?? 0,
    termination_reason: data.termination_reason ?? null,
  };
}

export async function incrementStrike(sessionId: string): Promise<number> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.rpc("increment_session_strike", {
    p_session_id: sessionId,
  });

  if (error || data == null) {
    throw new Error(error?.message ?? "Failed to increment moderation strike");
  }

  return data;
}

export async function terminateSession(sessionId: string, reason: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("sessions")
    .update({
      status: "terminated",
      termination_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
}

export function deriveModerationState(row: {
  status: SessionRow["status"];
  moderation_strikes?: number | null;
  termination_reason?: string | null;
}): ModerationState {
  const strikes = row.moderation_strikes ?? 0;
  const terminationReason = row.termination_reason ?? undefined;

  if (row.status === "terminated" || strikes >= 2) {
    return { strikes, status: "terminated", terminationReason };
  }
  if (strikes === 1) {
    return { strikes, status: "warned", terminationReason };
  }
  return { strikes, status: "active", terminationReason };
}
