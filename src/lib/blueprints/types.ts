import { z } from "zod";

import type { BlueprintRow } from "@/lib/supabase/types";

export const BLUEPRINT_PROMPT_VERSION = "purpose-blueprint-v2";

export const blueprintIkigaiCircleSchema = z.object({
  label: z.string().min(1),
  title: z.string().min(1),
  /** Optional pull-quote; grounded in the transcript when possible */
  quote: z.string().min(1).optional(),
  body: z.string().min(1),
});

export const blueprintContentSchema = z.object({
  openingLetter: z.array(z.string().min(1)).min(1).max(2),
  ikigai: z.object({
    passion: blueprintIkigaiCircleSchema,
    vocation: blueprintIkigaiCircleSchema,
    mission: blueprintIkigaiCircleSchema,
    profession: blueprintIkigaiCircleSchema,
  }),
  tensionMap: z
    .array(
      z.object({
        left: z.string().min(1),
        right: z.string().min(1),
        description: z.string().min(1),
      })
    )
    .min(2)
    .max(3),
  shadowSide: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    fearTitle: z.string().min(1).optional(),
    fearBody: z.string().min(1).optional(),
  }),
  /** Short lines / phrases that mirror their language (Dani: "Words that might meet you where you are") */
  resonantPhrases: z.array(z.string().min(1)).min(2).max(8).optional(),
  /** People / voices that feel adjacent to their path */
  resonantVoices: z
    .array(
      z.object({
        name: z.string().min(1),
        note: z.string().min(1),
      })
    )
    .min(2)
    .max(5)
    .optional(),
  opportunities: z
    .array(
      z.object({
        tag: z.string().min(1),
        title: z.string().min(1),
        body: z.string().min(1),
      })
    )
    .min(3)
    .max(5),
  coreQuestion: z.string().min(1),
  books: z
    .array(
      z.object({
        title: z.string().min(1),
        author: z.string().min(1),
        why: z.string().min(1),
      })
    )
    .length(3),
  videos: z
    .array(
      z.object({
        title: z.string().min(1),
        speaker: z.string().optional(),
        url: z.string().url(),
        why: z.string().min(1),
      })
    )
    .length(3),
  careerArchetype: z.object({
    name: z.string().min(1),
    body: z.string().min(1),
    examples: z
      .array(
        z.object({
          name: z.string().min(1),
          lesson: z.string().min(1),
        })
      )
      .length(2),
  }),
  closingNote: z.array(z.string().min(1)).min(1).max(3),
});

export type BlueprintIkigaiCircle = z.infer<typeof blueprintIkigaiCircleSchema>;
export type BlueprintContent = z.infer<typeof blueprintContentSchema>;

function sanitizeBlueprintPayload(value: unknown) {
  if (!value || typeof value !== "object") return value;
  const clone = { ...(value as Record<string, unknown>) };

  if (Array.isArray(clone.resonantPhrases) && clone.resonantPhrases.length < 2) {
    delete clone.resonantPhrases;
  }
  if (Array.isArray(clone.resonantVoices) && clone.resonantVoices.length < 2) {
    delete clone.resonantVoices;
  }

  return clone;
}

export function parseBlueprintContent(value: unknown): BlueprintContent {
  return blueprintContentSchema.parse(sanitizeBlueprintPayload(value));
}

export function parseBlueprintContentJson(value: string): BlueprintContent {
  return parseBlueprintContent(JSON.parse(value));
}

export function formatBlueprintContent(value: BlueprintContent) {
  return JSON.stringify(value, null, 2);
}

export function parseStoredBlueprintContent(blueprint: Pick<BlueprintRow, "content">) {
  return parseBlueprintContent(blueprint.content);
}
