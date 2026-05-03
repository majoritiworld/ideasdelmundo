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
import { generateBlueprintAction } from "@/lib/blueprints/actions";
import { requireAdminUser } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { BlueprintRow, SessionRow, TranscriptMessageRow } from "@/lib/supabase/types";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Internal sessions",
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

function getStatusVariant(status: SessionRow["status"]) {
  if (status === "completed") return "default";
  if (status === "abandoned") return "destructive";
  return "secondary";
}

function groupMessages(messages: TranscriptMessageRow[]) {
  return messages.reduce<Record<string, TranscriptMessageRow[]>>((acc, message) => {
    acc[message.session_id] = [...(acc[message.session_id] ?? []), message];
    return acc;
  }, {});
}

function groupBlueprints(blueprints: BlueprintRow[]) {
  return blueprints.reduce<Record<string, BlueprintRow>>((acc, blueprint) => {
    acc[blueprint.session_id] = blueprint;
    return acc;
  }, {});
}

async function getRecentSessions() {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: sessions, error: sessionsError } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  const sessionRows = sessions ?? [];
  const sessionIds = sessionRows.map((session) => session.id);

  if (sessionIds.length === 0) {
    return {
      sessions: sessionRows,
      messagesBySession: {},
      blueprintsBySession: {},
    };
  }

  const [messagesResult, blueprintsResult] = await Promise.all([
    supabaseAdmin
      .from("transcript_messages")
      .select("id, session_id, card_id, role, content, sequence, metadata, created_at")
      .in("session_id", sessionIds)
      .order("created_at", { ascending: true })
      .order("sequence", { ascending: true }),
    supabaseAdmin.from("blueprints").select("*").in("session_id", sessionIds),
  ]);

  if (messagesResult.error) {
    throw new Error(messagesResult.error.message);
  }

  if (blueprintsResult.error) {
    throw new Error(blueprintsResult.error.message);
  }

  return {
    sessions: sessionRows,
    messagesBySession: groupMessages(messagesResult.data ?? []),
    blueprintsBySession: groupBlueprints(blueprintsResult.data ?? []),
  };
}

export default async function InternalSessionsPage() {
  const user = await requireAdminUser();
  const { sessions, messagesBySession, blueprintsBySession } = await getRecentSessions();

  return (
    <PageContainer
      title="Internal sessions"
      subtitle={`Signed in as ${user.email}. Recent captured leads, journey progress, and saved transcript messages.`}
      maxWidth="max-w-7xl"
      actions={
        <form action={WEB_ROUTES.INTERNAL.LOGOUT} method="post">
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      }
    >
      <Card className="border-[#D5DCE6] bg-white">
        <CardHeader>
          <CardTitle>Recent sessions</CardTitle>
          <CardDescription>Showing the latest 50 sessions from Supabase.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table containerClassName="rounded-xl border border-[#E5EAF2]">
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Screen</TableHead>
                <TableHead>Cards</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Blueprint</TableHead>
                <TableHead>Transcript</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-[#5A6B82]">
                    No sessions captured yet.
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => {
                  const messages = messagesBySession[session.id] ?? [];
                  const blueprint = blueprintsBySession[session.id];
                  const preview = messages.slice(-2);

                  return (
                    <TableRow key={session.id} className="align-top">
                      <TableCell>
                        <div className="grid gap-1">
                          <span className="font-medium text-[#0F1B2D]">
                            {session.name || "Anonymous"}
                          </span>
                          <span className="text-xs text-[#5A6B82]">
                            {session.email || "No email yet"}
                          </span>
                          <span className="max-w-[180px] truncate text-[11px] text-[#7B8FA8]">
                            {session.id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(session.status)}>{session.status}</Badge>
                      </TableCell>
                      <TableCell>{session.current_screen || "Unknown"}</TableCell>
                      <TableCell>
                        {session.cards_explored_count ?? session.visited_card_ids?.length ?? 0}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {session.source || "Not set"}
                      </TableCell>
                      <TableCell>{formatDate(session.created_at)}</TableCell>
                      <TableCell className="min-w-[170px]">
                        {blueprint ? (
                          <div className="grid gap-2">
                            <Badge variant={getStatusVariant(session.status)}>
                              {blueprint.status}
                            </Badge>
                            <Button asChild size="sm" variant="outline">
                              <Link href={WEB_ROUTES.INTERNAL.BLUEPRINT_BY_ID(blueprint.id)}>
                                Review
                              </Link>
                            </Button>
                          </div>
                        ) : session.status === "completed" &&
                          session.email &&
                          messages.length > 0 ? (
                          <form action={generateBlueprintAction}>
                            <input type="hidden" name="sessionId" value={session.id} />
                            <Button type="submit" size="sm">
                              Generate
                            </Button>
                          </form>
                        ) : (
                          <span className="text-xs text-[#7B8FA8]">Not ready</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[360px] min-w-[280px] whitespace-normal">
                        {messages.length === 0 ? (
                          <span className="text-[#7B8FA8]">No messages yet</span>
                        ) : (
                          <div className="grid gap-2">
                            <span className="text-xs font-medium text-[#5A6B82]">
                              {messages.length} saved messages
                            </span>
                            {preview.map((message) => (
                              <p
                                key={message.id}
                                className="line-clamp-2 text-xs leading-5 text-[#0F1B2D]"
                              >
                                <span className="font-medium capitalize">{message.role}:</span>{" "}
                                {message.content}
                              </p>
                            ))}
                          </div>
                        )}
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
