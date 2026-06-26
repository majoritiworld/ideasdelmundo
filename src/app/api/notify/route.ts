import { after, NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";

import { generateBlueprintDraft } from "@/lib/blueprints/server";
import { RESEND_FROM_EMAIL } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  formatTranscriptText,
  getTranscriptFileName,
  getTranscriptMessagesForSession,
} from "@/lib/transcripts";
import type { SessionUpdate } from "@/lib/supabase/types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function jsonError(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function parseNotifyEmails(value: string | undefined) {
  return value
    ?.split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function getPublicName(name: string | null | undefined, email: string) {
  return name?.trim() || email.split("@")[0]?.trim() || "Guest";
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, sessionId } = (await req.json()) as {
      name?: string;
      email?: string;
      sessionId?: string | null;
    };

    if (!sessionId) {
      return jsonError(400, "Missing sessionId");
    }

    const notifyEmails = parseNotifyEmails(process.env.NOTIFY_EMAIL);

    if (!process.env.RESEND_API_KEY || !notifyEmails?.length) {
      console.error("[notify-api] Missing RESEND_API_KEY or NOTIFY_EMAIL");
      return jsonError(500, "Notification email is not configured");
    }

    const supabaseAdmin = getSupabaseAdmin();
    const [{ data: session, error: sessionError }, { data: transcriptMessages, error: messagesError }] =
      await Promise.all([
        supabaseAdmin.from("sessions").select("*").eq("id", sessionId).maybeSingle(),
        supabaseAdmin
          .from("transcript_messages")
          .select("id, session_id, card_id, role, content, sequence, metadata, created_at")
          .eq("session_id", sessionId)
          .order("sequence", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

    if (sessionError) return jsonError(500, sessionError.message);
    if (messagesError) return jsonError(500, messagesError.message);
    if (!session) return jsonError(404, "Session not found");
    if (session.status === "terminated") {
      // A terminated session is a hard exclusion: no email, no owner notify, no blueprint.
      return NextResponse.json({ ok: true, skipped: true, terminated: true });
    }
    if (session.completion_notified_at) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const recipientEmail = session.email?.trim() || email?.trim();
    if (!recipientEmail) {
      return jsonError(400, "Session needs an email before notifications can be sent");
    }

    const now = new Date().toISOString();
    const updatePayload: SessionUpdate = {
      status: "completed",
      current_screen: "closing",
      completed_at: session.completed_at ?? now,
      completion_notified_at: now,
    };

    if (!session.email) {
      updatePayload.email = recipientEmail;
    }

    const { data: lockedSessions, error: lockError } = await supabaseAdmin
      .from("sessions")
      .update(updatePayload)
      .eq("id", session.id)
      .is("completion_notified_at", null)
      .select("*");

    if (lockError) return jsonError(500, lockError.message);
    const lockedSession = lockedSessions?.[0];
    if (!lockedSession) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const publicName = getPublicName(lockedSession.name || name, recipientEmail);
    const safeName = escapeHtml(publicName);
    const safeEmail = escapeHtml(recipientEmail);
    const safeSessionId = escapeHtml(lockedSession.id);
    const safeCompletedAt = escapeHtml(new Date(now).toLocaleString());
    const messages = getTranscriptMessagesForSession(lockedSession, transcriptMessages ?? []);
    const transcript = formatTranscriptText(lockedSession, messages);

    // Releases the notified lock so a failed run can be retried instead of being
    // permanently stranded as "notified" without the user ever being emailed.
    const releaseNotifiedLock = async () => {
      const { error: rollbackError } = await supabaseAdmin
        .from("sessions")
        .update({ completion_notified_at: null })
        .eq("id", lockedSession.id);
      if (rollbackError) {
        console.error("[notify-api] Failed to release notified lock", rollbackError);
      }
    };

    // Send the user-facing confirmation FIRST — it's the promise we made on screen.
    // If it fails, release the lock so the next attempt retries cleanly (and no
    // owner email has gone out yet, so there's nothing to duplicate).
    const confirmationEmail = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: recipientEmail,
      subject: "Your Purpose Blueprint is being prepared",
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #0F1B2D;">
          <h1 style="font-size: 24px; margin-bottom: 8px;">Thanks for completing Majoriti's Purpose Blueprint Experience!</h1>
          <p style="color: #5A6B82; font-size: 16px; line-height: 1.6;">
            You will receive your personalized blueprint in the next 24-48 hours.
          </p>
          <p style="margin-top: 40px; color: #7B8FA8; font-size: 13px;">@majoriti.world</p>
        </div>
      `,
    });

    if (confirmationEmail.error) {
      console.error("[notify-api] Confirmation email failed", confirmationEmail.error);
      await releaseNotifiedLock();
      return jsonError(500, "Confirmation email failed");
    }

    // Owner alert is best-effort: the team's reliable source of truth is the
    // sessions dashboard (status = completed) plus the auto-generated draft below.
    // A failure here is logged but must NOT strand the user's confirmed state or
    // trigger a retry that double-sends the confirmation above.
    const ownerEmail = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: notifyEmails,
      subject: `New Purpose Blueprint completed - ${publicName}`,
      html: `
        <h2>New completion</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Completed at:</strong> ${safeCompletedAt}</p>
        <p><strong>Session ID:</strong> ${safeSessionId}</p>
      `,
      attachments: [
        {
          filename: getTranscriptFileName(lockedSession),
          content: Buffer.from(transcript, "utf8"),
        },
      ],
    });

    if (ownerEmail.error) {
      console.error("[notify-api] Owner email failed (non-fatal)", ownerEmail.error);
    }

    const sessionIdForBlueprint = lockedSession.id;
    after(async () => {
      try {
        await generateBlueprintDraft(sessionIdForBlueprint);
      } catch (blueprintErr) {
        console.error("[notify-api] blueprint generation failed", blueprintErr);
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notify-api]", err);
    return jsonError(500, "Notification request failed");
  }
}
