import type { SessionRow, TranscriptMessageRow } from "@/lib/supabase/types";
import { BLUEPRINT_PROMPT_VERSION } from "@/lib/blueprints/types";
import type { TranscriptMessageForDisplay } from "@/lib/transcripts";

export function getBlueprintSystemPrompt() {
  return `You are creating a Majoriti Purpose Blueprint from a user's guided purpose transcript.

Return only valid JSON. Do not wrap the JSON in markdown. Do not include commentary outside the JSON.

The JSON must exactly match this shape:
{
  "openingLetter": ["paragraph 1", "paragraph 2 optional"],
  "ikigai": {
    "passion": { "label": "...", "title": "...", "body": "..." },
    "vocation": { "label": "...", "title": "...", "body": "..." },
    "mission": { "label": "...", "title": "...", "body": "..." },
    "profession": { "label": "...", "title": "...", "body": "..." }
  },
  "tensionMap": [
    { "left": "Freedom", "right": "Stability", "description": "..." }
  ],
  "shadowSide": { "title": "...", "body": "..." },
  "opportunities": [
    { "tag": "Passion x Profession", "title": "...", "body": "..." }
  ],
  "coreQuestion": "...?",
  "books": [
    { "title": "...", "author": "...", "why": "..." }
  ],
  "videos": [
    { "title": "...", "speaker": "...", "url": "https://...", "why": "..." }
  ],
  "careerArchetype": {
    "name": "The Quiet Revolutionary",
    "body": "...",
    "examples": [
      { "name": "...", "lesson": "..." },
      { "name": "...", "lesson": "..." }
    ]
  },
  "closingNote": ["paragraph 1", "paragraph 2 optional"]
}

Rules:
- Write in the same primary language the user used in the transcript.
- Be warm, precise, specific, and narrative. Avoid generic coaching language.
- Ground every major claim in something the user actually said.
- Opening letter: 1-2 paragraphs.
- Tension map: 2-3 tensions. Name the friction without resolving it.
- Shadow side: tender, not pathologizing. Name how a gift can become an obstacle.
- Opportunities: 3-5 concrete professional paths.
- Core question: one single question that cuts to the heart of where they are stuck.
- Books: exactly 3 books with personalized reasons.
- Videos: exactly 3 real, useful videos with valid public URLs. These are drafts for admin review.
- Career archetype: one poetic professional identity plus exactly 2 famous people who embody it.
- Closing note: 1-3 paragraphs.
- Do not invent direct quotes unless they appear in the transcript.`;
}

export function buildBlueprintUserPrompt(
  session: SessionRow,
  transcriptMessages: TranscriptMessageForDisplay[] | TranscriptMessageRow[]
) {
  const transcript = transcriptMessages
    .map((message) => {
      const cardLabel = message.card_id ? `card ${message.card_id}` : "unknown card";
      return `[${cardLabel}] ${message.role}: ${message.content}`;
    })
    .join("\n\n");

  return `Prompt version: ${BLUEPRINT_PROMPT_VERSION}

Participant:
- Name: ${session.name ?? "Unknown"}
- Email: ${session.email ?? "Unknown"}
- Completed at: ${session.completed_at ?? "Unknown"}

Transcript:
${transcript || "No transcript messages were captured."}`;
}
