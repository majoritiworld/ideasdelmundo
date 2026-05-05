import Link from "next/link";

import { PageContainer } from "@/components/app/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import WEB_ROUTES from "@/constants/web-routes.constants";
import { CONFIG } from "@/lib/app-config";
import { requireAdminUser } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { BlueprintRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Internal blueprints",
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

function getStatusVariant(status: BlueprintRow["status"]) {
  if (status === "sent" || status === "published") return "default";
  if (status === "reviewed") return "secondary";
  return "outline";
}

async function getBlueprints() {
  const { data, error } = await getSupabaseAdmin()
    .from("blueprints")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function InternalBlueprintsPage() {
  await requireAdminUser();
  const blueprints = await getBlueprints();

  return (
    <PageContainer
      title="Internal blueprints"
      subtitle="Generated blueprint drafts, reviews, publishing status, and sent links."
      maxWidth="max-w-7xl"
      actions={
        <Button asChild variant="outline">
          <Link href={WEB_ROUTES.INTERNAL.SESSIONS}>Back to sessions</Link>
        </Button>
      }
    >
      <Card className="border-[#D5DCE6] bg-white">
        <CardHeader>
          <CardTitle>Blueprints</CardTitle>
          <CardDescription>Showing the latest 100 generated blueprints from Supabase.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table containerClassName="rounded-xl border border-[#E5EAF2]">
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Public link</TableHead>
                <TableHead>Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blueprints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-[#5A6B82]">
                    No blueprints generated yet.
                  </TableCell>
                </TableRow>
              ) : (
                blueprints.map((blueprint) => {
                  const publicUrl = `${CONFIG.siteUrl}${WEB_ROUTES.BLUEPRINT.BY_SLUG(blueprint.slug)}`;

                  return (
                    <TableRow key={blueprint.id} className="align-top">
                      <TableCell>
                        <div className="grid gap-1">
                          <span className="font-medium text-[#0F1B2D]">{blueprint.name}</span>
                          <span className="text-xs text-[#5A6B82]">{blueprint.email}</span>
                          <span className="max-w-[180px] truncate text-[11px] text-[#7B8FA8]">
                            {blueprint.session_id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(blueprint.status)}>
                          {blueprint.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(blueprint.generated_at)}</TableCell>
                      <TableCell>{formatDate(blueprint.published_at)}</TableCell>
                      <TableCell>{formatDate(blueprint.sent_at)}</TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="outline">
                          <Link href={publicUrl} target="_blank" rel="noreferrer">
                            Open
                          </Link>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button asChild size="sm">
                          <Link href={WEB_ROUTES.INTERNAL.BLUEPRINT_BY_ID(blueprint.id)}>
                            Review
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
