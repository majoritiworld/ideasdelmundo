import { z } from "zod";

import type { BlueprintRow } from "@/lib/supabase/types";

export const BLUEPRINT_PROMPT_VERSION = "purpose-blueprint-v1";

export const blueprintIkigaiCircleSchema = z.object({
  label: z.string().min(1),
  title: z.string().min(1),
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
  }),
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

export function parseBlueprintContent(value: unknown): BlueprintContent {
  return blueprintContentSchema.parse(value);
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
