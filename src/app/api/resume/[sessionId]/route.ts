import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";

function jsonError(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from("sessions").select("*").eq("id", sessionId).maybeSingle();

    if (error) return jsonError(500, error.message);
    if (!data) return jsonError(404, "Session not found");

    return NextResponse.json({ ok: true, session: data });
  } catch (err) {
    console.error("[resume-api]", err);
    return jsonError(500, "Resume request failed");
  }
}
