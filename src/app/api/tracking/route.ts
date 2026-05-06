import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import type {
  Json,
  SessionInsert,
  SessionUpdate,
  TranscriptMessageInsert,
} from "@/lib/supabase/types";

type TrackingPayload =
  | {
      action: "createSession";
      fields?: SessionInsert;
    }
  | {
      action: "updateSession";
      sessionId?: string | null;
      fields: SessionUpdate;
    }
  | {
      action: "logEvent";
      sessionId?: string | null;
      eventType: string;
      metadata?: Record<string, Json | undefined>;
    }
  | {
      action: "logTranscriptMessage";
      sessionId?: string | null;
      message: Omit<TranscriptMessageInsert, "session_id">;
    };

function jsonError(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as TrackingPayload;
    const supabaseAdmin = getSupabaseAdmin();

    if (payload.action === "createSession") {
      const id = crypto.randomUUID();
      const { error } = await supabaseAdmin.from("sessions").insert({
        id,
        status: "started",
        current_screen: "welcome",
        visited_card_ids: [],
        cards_explored_count: 0,
        conversations: {},
        current_section: 1,
        answered_question_ids: [],
        core_answered: [],
        seen_pause_hint: false,
        meditation_completed: false,
        ...payload.fields,
      });

      if (error) return jsonError(500, error.message);

      return NextResponse.json({ ok: true, id });
    }

    if (payload.action === "updateSession") {
      if (!payload.sessionId) return jsonError(400, "Missing sessionId");

      const { error } = await supabaseAdmin
        .from("sessions")
        .update(payload.fields)
        .eq("id", payload.sessionId);

      if (error) return jsonError(500, error.message);

      return NextResponse.json({ ok: true });
    }

    if (payload.action === "logEvent") {
      if (!payload.sessionId) return jsonError(400, "Missing sessionId");

      const { error } = await supabaseAdmin.from("events").insert({
        session_id: payload.sessionId,
        event_type: payload.eventType,
        metadata: payload.metadata ?? {},
      });

      if (error) return jsonError(500, error.message);

      return NextResponse.json({ ok: true });
    }

    if (payload.action === "logTranscriptMessage") {
      if (!payload.sessionId) return jsonError(400, "Missing sessionId");

      const { error } = await supabaseAdmin.from("transcript_messages").insert({
        session_id: payload.sessionId,
        ...payload.message,
      });

      if (error) return jsonError(500, error.message);

      return NextResponse.json({ ok: true });
    }

    return jsonError(400, "Unknown tracking action");
  } catch (err) {
    console.error("[tracking-api]", err);
    return jsonError(500, "Tracking request failed");
  }
}
