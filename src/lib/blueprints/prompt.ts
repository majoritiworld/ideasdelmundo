import type { SessionRow, TranscriptMessageRow } from "@/lib/supabase/types";
import { BLUEPRINT_PROMPT_VERSION } from "@/lib/blueprints/types";
import type { TranscriptMessageForDisplay } from "@/lib/transcripts";

export function getBlueprintSystemPrompt() {
  return `You are creating a Majoriti Purpose Blueprint from a user's guided purpose transcript.
The output follows the same narrative arc as the team's reference blueprint: opening letter, Ikigai exploration, named tensions (contradictions), gift-and-shadow including an optional named fear, paths taking shape, resonant language and voices, the core question, curated books and videos, career archetype with two exemplars, and a gentle closing.

Return only valid JSON. Do not wrap the JSON in markdown. Do not include commentary outside the JSON.

The JSON must exactly match this shape:
{
  "openingLetter": ["paragraph 1", "paragraph 2 optional"],
  "ikigai": {
    "passion": { "label": "...", "title": "...", "quote": "optional short line in quotes if it fits the transcript", "body": "..." },
    "vocation": { "label": "...", "title": "...", "quote": "optional", "body": "..." },
    "mission": { "label": "...", "title": "...", "quote": "optional", "body": "..." },
    "profession": { "label": "...", "title": "...", "quote": "optional", "body": "..." }
  },
  "tensionMap": [
    { "left": "Freedom", "right": "Stability", "description": "..." }
  ],
  "shadowSide": {
    "title": "...",
    "body": "...",
    "fearTitle": "optional short h3-style label, e.g. a fear under the surface",
    "fearBody": "optional 1-3 sentences"
  },
  "resonantPhrases": ["phrase 1", "phrase 2", "..."],
  "resonantVoices": [
    { "name": "Full name", "note": "one sentence why this voice may resonate" }
  ],
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
- Opening letter: 1-2 paragraphs; start from a concrete image or moment they named when possible.
- Ikigai labels should follow the four lenses (what you love, what you're great at, what the world needs, what you can be paid for) but phrased in fresh, personal language. Include "quote" only when it clearly reflects their wording or a paraphrase that stays faithful.
- Tension map: 2-3 tensions. These are contradictions that drive them — not problems to fix. Name the friction without resolving it.
- Shadow side: tender, not pathologizing. Name how a gift can become an obstacle. If a distinct fear shows up in the transcript, set fearTitle and fearBody; otherwise omit both.
- Resonant phrases: 3-6 short lines (like anchors or invitations) in their voice — not advice slogans.
- Resonant voices: 2-4 real public figures, authors, teachers, or artists whose work plausibly adjoins their path. Full names.
- Opportunities: 3-5 concrete professional or creative paths already visible in the transcript.
- Core question: one question that meets them where they are.
- Books: exactly 3 books with personalized reasons.
- Videos: exactly 3 real videos with valid public URLs (TED, YouTube, etc.). Drafts for admin review.
- Career archetype: one poetic professional identity; examples are exactly 2 real people with a short lesson each.
- Closing note: 1-3 paragraphs; end softly.
- Do not invent verbatim quotes unless they appear in the transcript.`;
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
