import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";

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

export async function POST(req: NextRequest) {
  try {
    const { name, email, sessionId } = (await req.json()) as {
      name?: string;
      email?: string;
      sessionId?: string | null;
    };

    if (!name || !email || !sessionId) {
      return jsonError(400, "Missing required fields");
    }

    const notifyEmails = parseNotifyEmails(process.env.NOTIFY_EMAIL);

    if (!process.env.RESEND_API_KEY || !notifyEmails?.length) {
      console.error("[notify-api] Missing RESEND_API_KEY or NOTIFY_EMAIL");
      return jsonError(500, "Notification email is not configured");
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSessionId = escapeHtml(sessionId);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

    const ownerEmail = await resend.emails.send({
      from: "Purpose Blueprint <onboarding@resend.dev>",
      to: notifyEmails,
      subject: `New Purpose Blueprint completed - ${name}`,
      html: `
        <h2>New completion</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Completed at:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Session ID:</strong> ${safeSessionId}</p>
      `,
    });

    if (ownerEmail.error) {
      console.error("[notify-api] Owner email failed", ownerEmail.error);
      return jsonError(500, "Owner notification email failed");
    }

    const confirmationEmail = await resend.emails.send({
      from: "Purpose Blueprint <onboarding@resend.dev>",
      to: email,
      subject: "Your Purpose Blueprint is being prepared",
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #0F1B2D;">
          <h1 style="font-size: 24px; margin-bottom: 8px;">Thank you, ${safeName}.</h1>
          <p style="color: #5A6B82; font-size: 16px; line-height: 1.6;">
            You just did something most people never do. We've received all your answers and our team is already working on your personalized Purpose Blueprint.
          </p>
          <p style="color: #5A6B82; font-size: 16px; line-height: 1.6;">
            You'll receive it in the next 48 hours. In the meantime, you can download your transcript below - your answers belong to you.
          </p>
          <a href="${appUrl}" style="display: inline-block; margin-top: 24px; background: #1B3DD4; color: white; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-size: 15px;">
            Download my transcript
          </a>
          <p style="margin-top: 40px; color: #7B8FA8; font-size: 13px;">@sebastian_majoriti</p>
        </div>
      `,
    });

    if (confirmationEmail.error) {
      console.error("[notify-api] Confirmation email failed", confirmationEmail.error);
      return jsonError(500, "Confirmation email failed");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notify-api]", err);
    return jsonError(500, "Notification request failed");
  }
}
