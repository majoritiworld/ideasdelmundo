import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  formatTranscriptText,
  getTranscriptFileName,
  getTranscriptMessagesForSession,
} from "@/lib/transcripts";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser();

  const { id } = await params;
  const supabaseAdmin = getSupabaseAdmin();

  const [{ data: session, error: sessionError }, { data: transcriptMessages, error: messagesError }] =
    await Promise.all([
      supabaseAdmin.from("sessions").select("*").eq("id", id).maybeSingle(),
      supabaseAdmin
        .from("transcript_messages")
        .select("id, session_id, card_id, role, content, sequence, metadata, created_at")
        .eq("session_id", id)
        .order("sequence", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

  if (sessionError) throw new Error(sessionError.message);
  if (messagesError) throw new Error(messagesError.message);
  if (!session) notFound();

  const messages = getTranscriptMessagesForSession(session, transcriptMessages ?? []);
  const transcript = formatTranscriptText(session, messages);

  return new NextResponse(transcript, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${getTranscriptFileName(session)}"`,
    },
  });
}
