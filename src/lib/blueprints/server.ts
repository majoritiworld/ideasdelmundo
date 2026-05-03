import Anthropic from "@anthropic-ai/sdk";

import { buildBlueprintUserPrompt, getBlueprintSystemPrompt } from "@/lib/blueprints/prompt";
import {
  BLUEPRINT_PROMPT_VERSION,
  parseBlueprintContent,
  type BlueprintContent,
} from "@/lib/blueprints/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { BlueprintRow, Json, SessionRow, TranscriptMessageRow } from "@/lib/supabase/types";

type GenerateBlueprintResult = {
  blueprint: BlueprintRow;
  content: BlueprintContent;
};

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function getMessageText(content: Anthropic.Messages.ContentBlock[]) {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getPublicName(session: SessionRow) {
  return session.name?.trim() || session.email?.split("@")[0]?.trim() || "guest";
}

async function createUniqueSlug(name: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const baseSlug = slugify(name) || "guest";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = crypto.randomUUID().slice(0, 6);
    const slug = `${baseSlug}-${suffix}`;
    const { data, error } = await supabaseAdmin
      .from("blueprints")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return slug;
  }

  return `${baseSlug}-${crypto.randomUUID().replaceAll("-", "").slice(0, 10)}`;
}

async function loadSession(sessionId: string): Promise<SessionRow & { email: string }> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Session not found");
  if (!data.email) throw new Error("Session needs an email before a blueprint can be generated");

  return data as SessionRow & { email: string };
}

async function loadTranscriptMessages(sessionId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("transcript_messages")
    .select("id, session_id, card_id, role, content, sequence, metadata, created_at")
    .eq("session_id", sessionId)
    .order("sequence", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

async function generateContent(session: SessionRow, messages: TranscriptMessageRow[]) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Anthropic API key is not configured");
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 5_000,
    temperature: 0.6,
    system: getBlueprintSystemPrompt(),
    messages: [
      {
        role: "user",
        content: buildBlueprintUserPrompt(session, messages),
      },
    ],
  });

  const text = getMessageText(response.content);
  if (!text) throw new Error("Anthropic returned an empty blueprint");

  return parseBlueprintContent(JSON.parse(text));
}

export async function generateBlueprintDraft(sessionId: string): Promise<GenerateBlueprintResult> {
  const supabaseAdmin = getSupabaseAdmin();
  const session = await loadSession(sessionId);
  const messages = await loadTranscriptMessages(sessionId);
  const content = await generateContent(session, messages);

  const { data: existingBlueprint, error: existingError } = await supabaseAdmin
    .from("blueprints")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  const now = new Date().toISOString();
  const payload = {
    session_id: session.id,
    user_id: session.user_id,
    email: session.email,
    name: getPublicName(session),
    status: "draft" as const,
    prompt_version: BLUEPRINT_PROMPT_VERSION,
    content: content as Json,
    generated_at: now,
    reviewed_at: null,
    published_at: null,
    sent_at: null,
  };

  if (existingBlueprint) {
    const { data, error } = await supabaseAdmin
      .from("blueprints")
      .update(payload)
      .eq("id", existingBlueprint.id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return { blueprint: data, content };
  }

  const slug = await createUniqueSlug(payload.name);
  const { data, error } = await supabaseAdmin
    .from("blueprints")
    .insert({ ...payload, slug })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return { blueprint: data, content };
}
