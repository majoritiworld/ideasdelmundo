import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = (await req.json()) as { sessionId?: string };

    if (!sessionId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await supabaseAdmin.from("sessions").update({ status: "abandoned" }).eq("id", sessionId).in("status", ["started", "in_progress"]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[abandon]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
