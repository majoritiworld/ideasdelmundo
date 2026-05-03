import Link from "next/link";
import { notFound } from "next/navigation";

import { PageContainer } from "@/components/app/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import WEB_ROUTES from "@/constants/web-routes.constants";
import {
  publishBlueprintAction,
  reviewBlueprintAction,
  saveBlueprintContentAction,
  sendBlueprintLinkAction,
} from "@/lib/blueprints/actions";
import { formatBlueprintContent, parseStoredBlueprintContent } from "@/lib/blueprints/types";
import { CONFIG } from "@/lib/app-config";
import { requireAdminUser } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Review blueprint",
  robots: {
    index: false,
    follow: false,
  },
};

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function getBlueprint(id: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("blueprints")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export default async function InternalBlueprintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminUser();
  const { id } = await params;
  const blueprint = await getBlueprint(id);

  if (!blueprint) {
    notFound();
  }

  const content = parseStoredBlueprintContent(blueprint);
  const publicUrl = `${CONFIG.siteUrl}${WEB_ROUTES.BLUEPRINT.BY_SLUG(blueprint.slug)}`;
  const contentJson = formatBlueprintContent(content);

  return (
    <PageContainer
      title={`Review blueprint for ${blueprint.name}`}
      subtitle={`${blueprint.email} · Generated ${formatDate(blueprint.generated_at)}`}
      maxWidth="max-w-6xl"
      actions={
        <>
          <Button asChild variant="outline">
            <Link href={WEB_ROUTES.INTERNAL.SESSIONS}>Back to sessions</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={publicUrl} target="_blank" rel="noreferrer">
              Open public link
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-[#D5DCE6] bg-white">
          <CardHeader>
            <CardTitle>Blueprint JSON</CardTitle>
            <CardDescription>
              Edit the structured content, then save or mark it reviewed. Invalid JSON will not
              save.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
              <input type="hidden" name="blueprintId" value={blueprint.id} />
              <Textarea
                name="contentJson"
                defaultValue={contentJson}
                className="min-h-[680px] font-mono text-xs leading-5"
                spellCheck={false}
              />
              <div className="flex flex-wrap gap-3">
                <Button type="submit" formAction={saveBlueprintContentAction} variant="outline">
                  Save draft
                </Button>
                <Button type="submit" formAction={reviewBlueprintAction}>
                  Save and mark reviewed
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid content-start gap-6">
          <Card className="border-[#D5DCE6] bg-white">
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Use these once the content is ready.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2 text-sm text-[#5A6B82]">
                <div className="flex items-center justify-between gap-3">
                  <span>Status</span>
                  <Badge>{blueprint.status}</Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Published</span>
                  <span>{formatDate(blueprint.published_at)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Sent</span>
                  <span>{formatDate(blueprint.sent_at)}</span>
                </div>
              </div>
              <form action={publishBlueprintAction}>
                <input type="hidden" name="blueprintId" value={blueprint.id} />
                <Button type="submit" className="w-full" disabled={blueprint.status !== "reviewed"}>
                  Publish blueprint
                </Button>
              </form>
              <form action={sendBlueprintLinkAction}>
                <input type="hidden" name="blueprintId" value={blueprint.id} />
                <Button
                  type="submit"
                  className="w-full"
                  variant="outline"
                  disabled={blueprint.status !== "published" && blueprint.status !== "sent"}
                >
                  Send link by email
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-[#D5DCE6] bg-white">
            <CardHeader>
              <CardTitle>Content Preview</CardTitle>
              <CardDescription>Quick check of the major generated sections.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 text-sm">
              <section>
                <p className="font-medium text-[#0F1B2D]">Archetype</p>
                <p className="mt-1 text-[#5A6B82]">{content.careerArchetype.name}</p>
              </section>
              <section>
                <p className="font-medium text-[#0F1B2D]">Core question</p>
                <p className="mt-1 text-[#5A6B82]">{content.coreQuestion}</p>
              </section>
              <section>
                <p className="font-medium text-[#0F1B2D]">Tensions</p>
                <ul className="mt-1 grid gap-1 text-[#5A6B82]">
                  {content.tensionMap.map((tension) => (
                    <li key={`${tension.left}-${tension.right}`}>
                      {tension.left} / {tension.right}
                    </li>
                  ))}
                </ul>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
