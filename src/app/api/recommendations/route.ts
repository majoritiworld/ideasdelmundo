import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";

import type { VideoRecommendation } from "@/lib/recommendations";
import { DEFAULT_FALLBACK, getPoolVideo, isPoolId, VIDEO_POOL } from "@/lib/videos";

interface RecommendationsRequest {
  transcript?: string;
  locale?: string;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const systemPrompt = `You are curating two videos for someone who just completed a guided Ikigai experience, to give them something worth watching while their full blueprint is prepared.

You are given a POOL of real, verified videos and the person's transcript. Your job is to SELECT the 2 videos from the pool that best match what this specific person shared, and write a short personalized rationale for each.

Return a JSON object with exactly this shape:

{
  "selections": [
    { "id": "<id from the pool>", "why": "<1-2 sentences, second person, referencing something specific this person said>" },
    { "id": "<id from the pool>", "why": "<1-2 sentences, second person, referencing something specific this person said>" }
  ]
}

Rules:
- selections: exactly 2 items.
- id: MUST be one of the ids from the provided pool. NEVER invent an id, a video, or a URL. If you are unsure, pick the closest pool entry.
- Prefer one "ted" and one "youtube" when both fit well.
- why: 1-2 sentences, warm, in second person, referencing something concrete from the transcript. Write it in the same language as the transcript.
- Return ONLY the raw JSON object. No markdown, no code fences, no backticks, no explanation. Response must start with { and end with }.`;

function jsonError(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function getMessageText(content: Anthropic.Messages.ContentBlock[]) {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

interface ModelSelection {
  id: string;
  why: string;
}

function parseSelections(text: string): ModelSelection[] {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as unknown;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Claude returned an invalid recommendations payload");
  }

  const selections = (parsed as Record<string, unknown>).selections;
  if (!Array.isArray(selections)) {
    throw new Error("Claude returned no selections");
  }

  return selections.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    if (typeof record.id !== "string") return [];

    return [
      {
        id: record.id,
        why: typeof record.why === "string" ? record.why.trim() : "",
      },
    ];
  });
}

/**
 * Validate model selections against the pool, drop hallucinated ids and
 * duplicates, then backfill from DEFAULT_FALLBACK so the result always has
 * exactly 2 valid, embeddable videos.
 */
function resolveRecommendations(selections: ModelSelection[]): VideoRecommendation[] {
  const resolved: VideoRecommendation[] = [];
  const used = new Set<string>();

  for (const selection of selections) {
    if (resolved.length === 2) break;
    if (used.has(selection.id) || !isPoolId(selection.id)) continue;

    const video = getPoolVideo(selection.id);
    if (!video) continue;

    used.add(selection.id);
    resolved.push({ video, why: selection.why });
  }

  const fallbackIds = [...DEFAULT_FALLBACK, ...VIDEO_POOL.map((video) => video.id)];
  for (const id of fallbackIds) {
    if (resolved.length === 2) break;
    if (used.has(id)) continue;

    const video = getPoolVideo(id);
    if (!video) continue;

    used.add(id);
    resolved.push({ video, why: "" });
  }

  return resolved;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as RecommendationsRequest;

    if (!payload.transcript?.trim()) {
      return jsonError(400, "Missing transcript");
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return jsonError(500, "Anthropic API key is not configured");
    }

    // Send only the fields needed for matching — never the prose or URLs.
    const pool = VIDEO_POOL.map((video) => ({
      id: video.id,
      type: video.type,
      title: video.title,
      creator: video.creator,
      themes: video.themes,
    }));

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 600,
      temperature: 0.5,
      system: [
        {
          type: "text" as const,
          text: systemPrompt,
          cache_control: { type: "ephemeral" as const },
        },
      ],
      messages: [
        {
          role: "user",
          content: `${payload.locale ? `Conversation language: ${payload.locale}\n\n` : ""}Video pool (select by id only):\n${JSON.stringify(pool)}\n\nTranscript:\n${payload.transcript}`,
        },
      ],
    });

    const text = getMessageText(response.content);

    let selections: ModelSelection[] = [];
    if (text) {
      try {
        selections = parseSelections(text);
      } catch (err) {
        console.warn("[recommendations-api] failed to parse selections", err);
      }
    }

    const recommendations = resolveRecommendations(selections);

    if (recommendations.length < 2) {
      return jsonError(500, "Unable to resolve two recommendations");
    }

    return NextResponse.json({ recommendations });
  } catch (err) {
    console.error("[recommendations-api]", err);
    return jsonError(500, "Unable to generate recommendations");
  }
}
