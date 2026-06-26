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
import { requireAdminUser } from "@/lib/admin-auth";
import { generateBlueprintAction } from "@/lib/blueprints/actions";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { SessionRow } from "@/lib/supabase/types";
import {
  getTranscriptMessagesForSession,
  type TranscriptMessageForDisplay,
} from "@/lib/transcripts";
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
  if (status === "abandoned" || status === "terminated") return "destructive";
  return "secondary";
}

function getReachabilityVariant(hasEmail: boolean) {
  return hasEmail ? "default" : "outline";
}

function groupMessages(messages: TranscriptMessageForDisplay[]) {
  return messages.reduce<Record<string, TranscriptMessageForDisplay[]>>((acc, message) => {
    acc[message.session_id] = [...(acc[message.session_id] ?? []), message];
    return acc;
  }, {});
}

async function getRecentSessions(completedOnly: boolean) {
  const supabaseAdmin = getSupabaseAdmin();
  let query = supabaseAdmin
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (completedOnly) {
    query = query.eq("status", "completed");
  }

  const { data: sessions, error: sessionsError } = await query;

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  const sessionRows = sessions ?? [];
  const sessionIds = sessionRows.map((session) => session.id);

  if (sessionIds.length === 0) {
    return {
      sessions: sessionRows,
      messagesBySession: {},
      blueprintBySessionId: {} as Record<string, { id: string; status: string }>,
    };
  }

  const messagesResult = await supabaseAdmin
    .from("transcript_messages")
    .select("id, session_id, card_id, role, content, sequence, metadata, created_at")
    .in("session_id", sessionIds)
    .order("created_at", { ascending: true })
    .order("sequence", { ascending: true });

  if (messagesResult.error) {
    throw new Error(messagesResult.error.message);
  }

  const blueprintsResult = await supabaseAdmin
    .from("blueprints")
    .select("id, session_id, status")
    .in("session_id", sessionIds);

  if (blueprintsResult.error) {
    throw new Error(blueprintsResult.error.message);
  }

  const blueprintBySessionId = (blueprintsResult.data ?? []).reduce<
    Record<string, { id: string; status: string }>
  >((acc, row) => {
    acc[row.session_id] = { id: row.id, status: row.status };
    return acc;
  }, {});

  return {
    sessions: sessionRows,
    messagesBySession: groupMessages(messagesResult.data ?? []),
    blueprintBySessionId,
  };
}

export default async function InternalSessionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ completed?: string }>;
}) {
  const user = await requireAdminUser();
  const completedOnly = (await searchParams)?.completed === "true";
  const { sessions, messagesBySession, blueprintBySessionId } = await getRecentSessions(completedOnly);

  return (
    <PageContainer
      title="Internal sessions"
      subtitle={`Signed in as ${user.email}. Recent captured leads, journey progress, and saved transcript messages.`}
      maxWidth="max-w-7xl"
      actions={
        <>
          <Button asChild variant="outline">
            <Link href={WEB_ROUTES.INTERNAL.BLUEPRINTS}>View blueprints</Link>
          </Button>
          <form action={WEB_ROUTES.INTERNAL.LOGOUT} method="post">
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </>
      }
    >
      <Card className="border-[#D5DCE6] bg-white">
        <CardHeader>
          <CardTitle>{completedOnly ? "Completed sessions" : "Recent sessions"}</CardTitle>
          <CardDescription>
            Showing the latest 50 {completedOnly ? "completed " : ""}sessions from Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-end">
            <Button asChild variant={completedOnly ? "default" : "outline"} size="sm">
              <Link
                href={
                  completedOnly
                    ? WEB_ROUTES.INTERNAL.SESSIONS
                    : `${WEB_ROUTES.INTERNAL.SESSIONS}?completed=true`
                }
              >
                {completedOnly ? "Show all sessions" : "Show completed only"}
              </Link>
            </Button>
          </div>
          <Table containerClassName="rounded-xl border border-[#E5EAF2]">
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Screen</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Transcript</TableHead>
                <TableHead>Blueprint</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-[#5A6B82]">
                    {completedOnly
                      ? "No completed sessions captured yet."
                      : "No sessions captured yet."}
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => {
                  const messages = getTranscriptMessagesForSession(
                    session,
                    messagesBySession[session.id] ?? []
                  );
                  const preview = messages.slice(-2);
                  const blueprint = blueprintBySessionId[session.id];
                  const canGenerateBlueprint = Boolean(
                    session.email?.trim() &&
                      messages.length > 0 &&
                      session.status !== "terminated"
                  );
                  const hasEmail = Boolean(session.email?.trim());

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
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant={getStatusVariant(session.status)}>{session.status}</Badge>
                          {session.status === "completed" ? (
                            <Badge
                              variant={getReachabilityVariant(hasEmail)}
                              className={
                                hasEmail
                                  ? "border-[#1D9E75]/30 bg-[#1D9E75]/10 text-[#157A5C]"
                                  : "border-[#D85A30]/30 bg-[#D85A30]/8 text-[#B84A28]"
                              }
                            >
                              {hasEmail ? "Reachable" : "No email"}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{session.current_screen || "Unknown"}</TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {session.source || "Not set"}
                      </TableCell>
                      <TableCell>{formatDate(session.created_at)}</TableCell>
                      <TableCell className="max-w-[360px] min-w-[280px] whitespace-normal">
                        {messages.length === 0 ? (
                          <span className="text-[#7B8FA8]">No messages yet</span>
                        ) : (
                          <div className="grid gap-2">
                            <span className="text-xs font-medium text-[#5A6B82]">
                              {messages.length} saved messages
                            </span>
                            <Button asChild size="sm" variant="outline" className="w-fit">
                              <Link href={WEB_ROUTES.INTERNAL.SESSION_TRANSCRIPT(session.id)}>
                                Download transcript
                              </Link>
                            </Button>
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
                      <TableCell className="min-w-[180px] align-top">
                        <div className="grid gap-2">
                          {blueprint ? (
                            <>
                              <Badge variant="outline">{blueprint.status}</Badge>
                              <Button asChild size="sm" variant="secondary" className="w-fit">
                                <Link href={WEB_ROUTES.INTERNAL.BLUEPRINT_BY_ID(blueprint.id)}>
                                  Open blueprint
                                </Link>
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-[#7B8FA8]">No blueprint yet</span>
                          )}
                          {canGenerateBlueprint ? (
                            <form action={generateBlueprintAction}>
                              <input type="hidden" name="sessionId" value={session.id} />
                              <Button type="submit" size="sm" variant="outline" className="w-full">
                                {blueprint ? "Regenerate" : "Generate"} blueprint
                              </Button>
                            </form>
                          ) : (
                            <span className="text-xs text-[#7B8FA8]">
                              Needs email + transcript to generate
                            </span>
                          )}
                        </div>
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
