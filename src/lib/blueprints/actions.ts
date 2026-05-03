"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import WEB_ROUTES from "@/constants/web-routes.constants";
import { CONFIG } from "@/lib/app-config";
import { sendBlueprintEmail } from "@/lib/blueprints/email";
import { generateBlueprintDraft } from "@/lib/blueprints/server";
import { parseBlueprintContentJson } from "@/lib/blueprints/types";
import { requireAdminUser } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

function getRequiredFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing ${key}`);
  }

  return value.trim();
}

export async function generateBlueprintAction(formData: FormData) {
  await requireAdminUser();

  const sessionId = getRequiredFormValue(formData, "sessionId");
  const { blueprint } = await generateBlueprintDraft(sessionId);

  revalidatePath(WEB_ROUTES.INTERNAL.SESSIONS);
  revalidatePath(WEB_ROUTES.INTERNAL.BLUEPRINTS);
  redirect(WEB_ROUTES.INTERNAL.BLUEPRINT_BY_ID(blueprint.id));
}

export async function saveBlueprintContentAction(formData: FormData) {
  await requireAdminUser();

  const blueprintId = getRequiredFormValue(formData, "blueprintId");
  const contentJson = getRequiredFormValue(formData, "contentJson");
  const content = parseBlueprintContentJson(contentJson);

  const { error } = await getSupabaseAdmin()
    .from("blueprints")
    .update({ content: content as Json })
    .eq("id", blueprintId);

  if (error) throw new Error(error.message);

  revalidatePath(WEB_ROUTES.INTERNAL.BLUEPRINT_BY_ID(blueprintId));
}

export async function reviewBlueprintAction(formData: FormData) {
  await requireAdminUser();

  const blueprintId = getRequiredFormValue(formData, "blueprintId");
  const contentJson = getRequiredFormValue(formData, "contentJson");
  const content = parseBlueprintContentJson(contentJson);

  const { error } = await getSupabaseAdmin()
    .from("blueprints")
    .update({
      content: content as Json,
      status: "reviewed",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", blueprintId);

  if (error) throw new Error(error.message);

  revalidatePath(WEB_ROUTES.INTERNAL.BLUEPRINT_BY_ID(blueprintId));
  revalidatePath(WEB_ROUTES.INTERNAL.SESSIONS);
}

export async function publishBlueprintAction(formData: FormData) {
  await requireAdminUser();

  const blueprintId = getRequiredFormValue(formData, "blueprintId");
  const { error } = await getSupabaseAdmin()
    .from("blueprints")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", blueprintId);

  if (error) throw new Error(error.message);

  revalidatePath(WEB_ROUTES.INTERNAL.BLUEPRINT_BY_ID(blueprintId));
  revalidatePath(WEB_ROUTES.INTERNAL.SESSIONS);
}

export async function sendBlueprintLinkAction(formData: FormData) {
  await requireAdminUser();

  const blueprintId = getRequiredFormValue(formData, "blueprintId");
  const supabaseAdmin = getSupabaseAdmin();
  const { data: blueprint, error: loadError } = await supabaseAdmin
    .from("blueprints")
    .select("*")
    .eq("id", blueprintId)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!blueprint) throw new Error("Blueprint not found");
  if (blueprint.status !== "published" && blueprint.status !== "sent") {
    throw new Error("Blueprint must be published before it can be sent");
  }

  const blueprintUrl = `${CONFIG.siteUrl}${WEB_ROUTES.BLUEPRINT.BY_SLUG(blueprint.slug)}`;
  await sendBlueprintEmail({
    name: blueprint.name,
    email: blueprint.email,
    blueprintUrl,
  });

  const now = new Date().toISOString();
  const { error: updateError } = await supabaseAdmin
    .from("blueprints")
    .update({
      status: "sent",
      sent_at: now,
      published_at: blueprint.published_at ?? now,
    })
    .eq("id", blueprint.id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath(WEB_ROUTES.INTERNAL.BLUEPRINT_BY_ID(blueprintId));
  revalidatePath(WEB_ROUTES.INTERNAL.SESSIONS);
}
