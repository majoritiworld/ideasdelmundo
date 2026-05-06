import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";

import WEB_ROUTES from "@/constants/web-routes.constants";
import { RESEND_FROM_EMAIL } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase/server";

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

function getAppUrl(req: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).replace(/\/$/, "");
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, name, email } = (await req.json()) as {
      sessionId?: string | null;
      name?: string | null;
      email?: string | null;
    };
    const recipientEmail = email?.trim();

    if (!sessionId) return jsonError(400, "Missing sessionId");
    if (!recipientEmail) return jsonError(400, "Missing email");
    if (!process.env.RESEND_API_KEY) return jsonError(500, "Resume email is not configured");

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("sessions")
      .update({ email: recipientEmail, status: "in_progress" })
      .eq("id", sessionId);

    if (error) return jsonError(500, error.message);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const publicName = name?.trim();
    const safeName = publicName ? escapeHtml(publicName) : "";
    const resumeUrl = `${getAppUrl(req)}${WEB_ROUTES.RESUME.BY_SESSION_ID(sessionId)}`;
    const safeResumeUrl = escapeHtml(resumeUrl);
    const subject = `${publicName ? `${publicName}, y` : "Y"}our Purpose Blueprint is paused`;
    const result = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: recipientEmail,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #0F1B2D; padding: 40px 24px;">
          <h1 style="font-size: 28px; margin-bottom: 16px; font-weight: 500;">We saved your progress${safeName ? `, ${safeName}` : ""}.</h1>
          <p style="color: #5A6B82; font-size: 16px; line-height: 1.7; margin-bottom: 24px;">
            Whenever you're ready to come back, click the link below and you'll pick up exactly where you left off. Your answers and your guide will be waiting.
          </p>
          <a href="${safeResumeUrl}" style="display: inline-block; background: #1B3DD4; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-size: 14px; font-family: monospace; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 32px;">
            Continue where you left off
          </a>
          <p style="color: #7B8FA8; font-size: 13px; line-height: 1.6; margin-top: 32px;">
            This link is unique to your session. Take your time. There's no expiration.
          </p>
          <p style="color: #7B8FA8; font-size: 12px; margin-top: 40px; font-family: monospace; letter-spacing: 0.05em;">@majoriti.world</p>
        </div>
      `,
    });

    if (result.error) {
      console.error("[pause-api] Resume email failed", result.error);
      return jsonError(500, "Resume email failed");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[pause-api]", err);
    return jsonError(500, "Pause request failed");
  }
}
