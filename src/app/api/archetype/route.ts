import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";

import type { ArchetypeResult } from "@/lib/archetype";

interface ArchetypeRequest {
  name?: string;
  transcript?: string;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const systemPrompt = `You are generating a live archetype reveal for someone who just completed a guided Ikigai experience. Based on their transcript, generate a JSON object with exactly this shape:

{
  "archetypeName": "The Prophetic Connector",
  "archetypeDescription": "2-3 sentences, warm and specific, written in second person. Reference something they actually said.",
  "purposeStatement": "One sentence declaration of what they are here to do. Bold and specific. Not a summary.",
  "references": [
    {
      "name": "Full name of a real well-known person",
      "descriptor": "4-6 word role description",
      "connection": "One sentence on why they share this archetype with the user."
    },
    {
      "name": "Full name of a second real well-known person",
      "descriptor": "4-6 word role description",
      "connection": "One sentence on why they share this archetype with the user."
    }
  ]
}

Rules:
- archetypeName: 2-4 poetic words (e.g. "The Prophetic Connector"). Never use generic personality type names.
- archetypeDescription: 2-3 sentences in second person, warm, specific to this person's transcript.
- purposeStatement: one sentence, specific, not generic.
- references: exactly 2 items, each with name, descriptor, and connection. Choose real people whose work is findable online.
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

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isReference(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const reference = value as Record<string, unknown>;

  return (
    isString(reference.name) && isString(reference.descriptor) && isString(reference.connection)
  );
}

function parseArchetypeResult(text: string): ArchetypeResult {
  // Strip markdown code fences if Claude wrapped the response
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as unknown;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Claude returned an invalid archetype");
  }

  const result = parsed as Record<string, unknown>;

  if (
    !isString(result.archetypeName) ||
    !isString(result.archetypeDescription) ||
    !isString(result.purposeStatement) ||
    !Array.isArray(result.references) ||
    result.references.length !== 2 ||
    !result.references.every(isReference)
  ) {
    throw new Error("Claude returned an incomplete archetype");
  }

  return result as unknown as ArchetypeResult;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ArchetypeRequest;

    if (!payload.transcript?.trim()) {
      return jsonError(400, "Missing transcript");
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return jsonError(500, "Anthropic API key is not configured");
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Name: ${payload.name?.trim() || "Participant"}\n\nTranscript:\n${payload.transcript}`,
        },
      ],
    });

    const text = getMessageText(response.content);
    if (!text) return jsonError(500, "Claude returned an empty archetype");

    return NextResponse.json(parseArchetypeResult(text));
  } catch (err) {
    console.error("[archetype-api]", err);
    return jsonError(500, "Unable to generate archetype");
  }
}
