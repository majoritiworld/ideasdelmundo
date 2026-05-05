import { Resend } from "resend";

import { RESEND_FROM_EMAIL } from "@/lib/email";

type SendBlueprintEmailPayload = {
  name: string;
  email: string;
  blueprintUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendBlueprintEmail({ name, email, blueprintUrl }: SendBlueprintEmailPayload) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Resend API key is not configured");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const safeName = escapeHtml(name);
  const safeBlueprintUrl = escapeHtml(blueprintUrl);

  const result = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: email,
    subject: "Your Purpose Blueprint is ready",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #0F1B2D;">
        <p style="font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; color: #5A6B82;">Your Purpose Blueprint</p>
        <h1 style="font-size: 28px; margin: 8px 0 16px;">${safeName}, your blueprint is ready.</h1>
        <p style="color: #5A6B82; font-size: 16px; line-height: 1.6;">
          We prepared your personalized Purpose Blueprint from the conversation you shared with us.
        </p>
        <p style="color: #5A6B82; font-size: 16px; line-height: 1.6;">
          The page is private. Open the link below and sign in with this same email address to read it.
        </p>
        <a href="${safeBlueprintUrl}" style="display: inline-block; margin-top: 24px; background: #1B3DD4; color: white; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-size: 15px;">
          Open my blueprint
        </a>
        <p style="margin-top: 40px; color: #7B8FA8; font-size: 13px;">The Majoriti team</p>
      </div>
    `,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }
}
