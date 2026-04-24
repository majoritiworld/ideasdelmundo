"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Iconify from "@/components/ui/iconify";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

const CAVEMAN_REPO_URL = "https://github.com/JuliusBrussee/caveman";

const TIP_LINKS = {
  claudeMem: {
    github: "https://github.com/thedotmack/claude-mem",
    docs: "https://docs.claude-mem.ai/",
  },
  uiUxProMax: {
    github: "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill",
  },
  awesomeClaudeCode: {
    github: "https://github.com/hesreallyhim/awesome-claude-code",
  },
} as const;

type CuratedTipId = keyof typeof TIP_LINKS;

const CURATED_TIP_IDS = Object.keys(TIP_LINKS) as CuratedTipId[];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

const CAVEMAN_INSTALL_ROWS = [
  {
    id: "claudeCode",
    command:
      "claude plugin marketplace add JuliusBrussee/caveman && claude plugin install caveman@caveman",
  },
  {
    id: "codex",
    command: 'Clone repo → /plugins → Search "Caveman" → Install',
  },
  {
    id: "geminiCli",
    command: "gemini extensions install https://github.com/JuliusBrussee/caveman",
  },
  {
    id: "cursor",
    command: "npx skills add JuliusBrussee/caveman -a cursor",
  },
  {
    id: "windsurf",
    command: "npx skills add JuliusBrussee/caveman -a windsurf",
  },
  {
    id: "copilot",
    command: "npx skills add JuliusBrussee/caveman -a github-copilot",
  },
  {
    id: "cline",
    command: "npx skills add JuliusBrussee/caveman -a cline",
  },
  {
    id: "anyOther",
    command: "npx skills add JuliusBrussee/caveman",
  },
] as const;

export function DemoTokenUsageTab() {
  const t = useTranslations("demo.tokenUsage");
  const { copy } = useCopyToClipboard();
  const [lastCopied, setLastCopied] = React.useState<string | null>(null);

  const readStringList = React.useCallback(
    (tipId: CuratedTipId, key: "useCases" | "examples"): string[] => {
      const raw = t.raw(`tips.${tipId}.${key}` as Parameters<typeof t.raw>[0]);
      return isStringArray(raw) ? raw : [];
    },
    [t]
  );

  const handleCopy = React.useCallback(
    async (key: string, value: string) => {
      await copy(value);
      setLastCopied(key);
      window.setTimeout(() => {
        setLastCopied((current) => (current === key ? null : current));
      }, 2000);
    },
    [copy]
  );

  return (
    <div dir="ltr" className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription className="text-base">
            <Typography variant="body2" as="p" color="muted" className="leading-relaxed">
              {t("description")}
            </Typography>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-border/50 bg-muted/10 rounded-lg border p-4">
            <Typography variant="caption1" as="p" color="muted" className="leading-relaxed">
              {t("disclaimer")}
            </Typography>
          </div>
          <div className="space-y-4">
            <div className="border-border/60 bg-muted/20 rounded-xl border p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Typography variant="subtitle2" as="h3" className="text-foreground">
                  {t("cavemanTitle")}
                </Typography>
                <Badge variant="secondary" className="font-normal">
                  {t("featuredLabel")}
                </Badge>
              </div>
              <Typography
                variant="caption1"
                as="p"
                color="muted"
                className="mb-4 max-w-3xl leading-relaxed"
              >
                {t("cavemanDescription")}
              </Typography>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <a href={CAVEMAN_REPO_URL} target="_blank" rel="noopener noreferrer">
                  <Iconify icon="mdi:github" className="size-4" />
                  {t("cavemanLinkLabel")}
                </a>
              </Button>

              <div className="border-border/50 mt-6 border-t pt-6">
                <Typography variant="subtitle2" as="h4" className="text-foreground mb-3">
                  {t("installCommandsTitle")}
                </Typography>
                <Table containerClassName="rounded-lg border border-border/60 bg-background/50">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[9rem] min-w-[7rem]">{t("columnAgent")}</TableHead>
                      <TableHead>{t("columnInstall")}</TableHead>
                      <TableHead className="w-[7rem] text-end">
                        <span className="sr-only">{t("copyCommand")}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {CAVEMAN_INSTALL_ROWS.map((row) => {
                      const copyKey = `caveman-${row.id}`;
                      const isCopied = lastCopied === copyKey;

                      return (
                        <TableRow key={row.id}>
                          <TableCell className="text-foreground align-top font-medium">
                            {t(`agents.${row.id}`)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "max-w-[min(100%,36rem)] align-top whitespace-normal",
                              "text-muted-foreground break-words"
                            )}
                          >
                            <code className="text-foreground text-xs leading-relaxed">
                              {row.command}
                            </code>
                          </TableCell>
                          <TableCell className="text-end align-top">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              onClick={() => handleCopy(copyKey, row.command)}
                            >
                              <Iconify
                                icon={isCopied ? "lucide:check" : "lucide:copy"}
                                className="size-4 shrink-0"
                              />
                              {isCopied ? t("copied") : t("copyCommand")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="space-y-5">
              {CURATED_TIP_IDS.map((tipId) => {
                const links = TIP_LINKS[tipId];
                const useCases = readStringList(tipId, "useCases");
                const examples = readStringList(tipId, "examples");

                return (
                  <div key={tipId} className="border-border/60 bg-muted/20 rounded-xl border p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <Typography variant="subtitle2" as="h4" className="text-foreground">
                        {t(`tips.${tipId}.title`)}
                      </Typography>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Button asChild variant="outline" size="sm" className="gap-2">
                          <a href={links.github} target="_blank" rel="noopener noreferrer">
                            <Iconify icon="mdi:github" className="size-4" />
                            {t("linkGitHub")}
                          </a>
                        </Button>
                        {"docs" in links && links.docs ? (
                          <Button asChild variant="outline" size="sm" className="gap-2">
                            <a href={links.docs} target="_blank" rel="noopener noreferrer">
                              <Iconify icon="lucide:book-open" className="size-4" />
                              {t("linkDocumentation")}
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <Typography
                      variant="caption1"
                      as="p"
                      color="muted"
                      className="mt-3 max-w-3xl leading-relaxed"
                    >
                      {t(`tips.${tipId}.description`)}
                    </Typography>

                    <div className="mt-4 space-y-4">
                      <div>
                        <Typography variant="label2" as="p" className="text-foreground mb-1.5">
                          {t("whyItMattersLabel")}
                        </Typography>
                        <Typography
                          variant="body2"
                          as="p"
                          color="muted"
                          className="leading-relaxed"
                        >
                          {t(`tips.${tipId}.whyItMatters`)}
                        </Typography>
                      </div>

                      <div>
                        <Typography variant="label2" as="p" className="text-foreground mb-1.5">
                          {t("bestForLabel")}
                        </Typography>
                        <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm leading-relaxed">
                          {useCases.map((line, i) => (
                            <li key={`${tipId}-case-${i}`}>{line}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <Typography variant="label2" as="p" className="text-foreground mb-1.5">
                          {t("examplesLabel")}
                        </Typography>
                        <ul className="space-y-2">
                          {examples.map((line, i) => (
                            <li key={`${tipId}-ex-${i}`}>
                              <code className="border-border/60 bg-background/50 text-foreground block rounded-md border px-2.5 py-1.5 text-xs leading-relaxed">
                                {line}
                              </code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
