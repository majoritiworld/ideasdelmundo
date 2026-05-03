import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { BlueprintRenderer } from "@/components/blueprints/BlueprintRenderer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStaticBlueprint } from "@/lib/blueprints/static";
import { parseStoredBlueprintContent } from "@/lib/blueprints/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getBlueprint(slug: string) {
  const staticBlueprint = getStaticBlueprint(slug);
  const { data, error } = await getSupabaseAdmin()
    .from("blueprints")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    if (staticBlueprint && error.message.includes("blueprints")) {
      return staticBlueprint;
    }

    throw new Error(error.message);
  }

  return data ?? staticBlueprint;
}

export default async function BlueprintPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = await getTranslations("blueprint.access");
  const { slug } = await params;
  const blueprint = await getBlueprint(slug);

  if (!blueprint) {
    notFound();
  }

  if (blueprint.status !== "published" && blueprint.status !== "sent") {
    return <AccessShell title={t("notReadyTitle")} description={t("notReadyDescription")} />;
  }

  const content = parseStoredBlueprintContent(blueprint);
  return <BlueprintRenderer name={blueprint.name} content={content} />;
}

function AccessShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFBFE] px-5 py-10">
      <Card className="w-full max-w-md border-[#D5DCE6] bg-white">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {children ? <CardContent>{children}</CardContent> : null}
      </Card>
    </main>
  );
}
