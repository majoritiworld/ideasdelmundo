import { NextResponse } from "next/server";

const ELEVENLABS_AGENT_ID = "agent_4101kq56r4d6ecrvprha38492prn";
const ELEVENLABS_TOKEN_URL = "https://api.elevenlabs.io/v1/convai/conversation/token";

function jsonError(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function getElevenLabsErrorMessage(data: { detail?: unknown; message?: unknown }) {
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.message === "string") return data.message;
  if (data.detail && typeof data.detail === "object" && "message" in data.detail) {
    const message = (data.detail as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  if (data.detail) return JSON.stringify(data.detail);

  return "Unable to create ElevenLabs conversation token";
}

export async function POST() {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  const agentId = process.env.ELEVENLABS_AGENT_ID?.trim() || ELEVENLABS_AGENT_ID;

  if (!apiKey) {
    return jsonError(500, "Missing ELEVENLABS_API_KEY");
  }

  try {
    const response = await fetch(`${ELEVENLABS_TOKEN_URL}?agent_id=${encodeURIComponent(agentId)}`, {
      headers: {
        "xi-api-key": apiKey,
      },
      cache: "no-store",
    });

    const data = (await response.json()) as { token?: unknown; detail?: unknown; message?: unknown };

    if (!response.ok) {
      return jsonError(response.status, getElevenLabsErrorMessage(data));
    }

    if (typeof data.token !== "string") {
      return jsonError(502, "ElevenLabs token response was invalid");
    }

    return NextResponse.json({ ok: true, token: data.token });
  } catch (err) {
    console.error("[elevenlabs-token]", err);
    return jsonError(500, "ElevenLabs token request failed");
  }
}
