"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Iconify from "@/components/ui/iconify";
import { Typography } from "@/components/ui/typography";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import {
  GUIDE_CORE_FILES,
  GUIDE_FEATURE_STEPS,
  GUIDE_IGNORE_FILES,
  GUIDE_MISTAKES,
  GUIDE_OPTIONAL_FILES,
  PRODUCT_GUIDE_CREDITS,
  PRODUCT_GUIDE_GOOD_FIT,
  PRODUCT_GUIDE_LESS_SUITABLE,
  PRODUCT_GUIDE_PURPOSE_POINTS,
  PRODUCT_GUIDE_RESOURCES,
  PRODUCT_GUIDE_START_STEPS,
} from "@/components/demo/data";
import AnimatedDivBreathing from "../ui/animations/animated-div-breathing";

export function DemoGuideTab() {
  const tProductGuide = useTranslations("demo.productGuide");
  const { copy } = useCopyToClipboard();
  const [lastCopied, setLastCopied] = React.useState<string | null>(null);
  const resourcesById = React.useMemo(
    () => new Map(PRODUCT_GUIDE_RESOURCES.map((resource) => [resource.id, resource])),
    []
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

  const renderResourceLinks = React.useCallback(
    (stepId: string, resourceIds?: string[]) =>
      resourceIds?.map((resourceId) => {
        const resource = resourcesById.get(resourceId);

        if (!resource) return null;

        return (
          <Link
            key={`${stepId}-${resource.id}`}
            href={resource.href}
            target="_blank"
            rel="noreferrer"
            className="border-border/60 bg-muted/30 hover:border-primary/30 hover:bg-accent/40 block rounded-xl border p-3 transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Iconify icon={resource.icon} className="text-muted-foreground size-4 shrink-0" />
                <Typography
                  variant="label1"
                  as="h4"
                  className="text-foreground truncate text-sm font-medium"
                >
                  {tProductGuide(`resources.items.${resource.id}.title`)}
                </Typography>
              </div>
              <Typography
                variant="label2"
                as="span"
                className="text-primary inline-flex shrink-0 items-center gap-1 text-sm font-medium"
              >
                {tProductGuide("actions.openLink")}
                <Iconify icon="lucide:arrow-up-right" className="size-3.5" />
              </Typography>
            </div>
          </Link>
        );
      }),
    [resourcesById, tProductGuide]
  );

  const renderCommandBlocks = React.useCallback(
    (stepId: string, commands?: string[]) =>
      commands?.map((command, commandIndex) => {
        const copyKey = `step-${stepId}-${commandIndex}`;

        return (
          <div
            key={copyKey}
            className="border-border/70 bg-muted/40 space-y-2 rounded-xl border border-dashed p-3"
          >
            <Typography
              variant="caption2"
              as="span"
              className="text-muted-foreground block text-xs font-medium tracking-wide uppercase"
            >
              {tProductGuide("actions.commandLabel")}
            </Typography>
            <code className="bg-background text-foreground block rounded-md px-2 py-1.5 text-xs break-all">
              {command}
            </code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => handleCopy(copyKey, command)}
            >
              <Iconify
                icon={lastCopied === copyKey ? "lucide:check" : "lucide:copy"}
                className="size-4"
              />
              {lastCopied === copyKey
                ? tProductGuide("actions.copied")
                : tProductGuide("actions.copyCommand")}
            </Button>
          </div>
        );
      }),
    [handleCopy, lastCopied, tProductGuide]
  );

  return (
    <div className="space-y-10">
      {/* 1. Hero */}
      <AnimatedDivBreathing>
        <section className="from-primary/10 via-background to-background relative overflow-hidden rounded-2xl border bg-gradient-to-br p-8 shadow-sm md:p-10 rtl:bg-gradient-to-bl">
          <div className="from-primary/5 pointer-events-none absolute inset-y-0 end-0 w-1/2 bg-gradient-to-l to-transparent rtl:bg-gradient-to-r" />
          <div className="relative max-w-4xl space-y-4">
            <Badge variant="secondary" className="text-xs font-medium">
              {tProductGuide("eyebrow")}
            </Badge>
            <Typography
              variant="h2"
              as="h1"
              className="text-foreground text-4xl font-bold tracking-tight md:text-5xl"
            >
              {tProductGuide("title")}
            </Typography>
            <Typography variant="body2" className="text-muted-foreground text-lg leading-relaxed">
              {tProductGuide("subtitle")}
            </Typography>
          </div>
        </section>
      </AnimatedDivBreathing>

      {/* 2. For the vibe coder */}
      <section className="space-y-4">
        <div className="max-w-5xl space-y-2">
          <Typography
            variant="subtitle1"
            as="h2"
            className="text-foreground text-2xl font-semibold tracking-tight"
          >
            {tProductGuide("vibeCoder.title")}
          </Typography>
          <Typography variant="body2" className="text-muted-foreground leading-relaxed">
            {tProductGuide("vibeCoder.body")}
          </Typography>
        </div>
        <Card className="border-border/70">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start gap-3">
              <div className="bg-muted mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg text-indigo-500">
                <Iconify icon="lucide:bot" className="size-4" />
              </div>
              <Typography variant="caption1" className="text-muted-foreground leading-relaxed">
                {tProductGuide("vibeCoder.claudeNote")}
              </Typography>
            </div>
            <div className="border-border/50 space-y-2.5 border-t pt-4">
              {(["bullet1", "bullet2", "bullet3"] as const).map((key) => (
                <div key={key} className="flex items-start gap-2.5">
                  <Iconify icon="lucide:check" className="text-primary mt-0.5 size-4 shrink-0" />
                  <Typography variant="caption1" className="text-foreground">
                    {tProductGuide(`vibeCoder.${key}`)}
                  </Typography>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. Why */}
      <section className="space-y-6">
        <div className="max-w-4xl space-y-2">
          <Typography
            variant="subtitle1"
            as="h2"
            className="text-foreground text-2xl font-semibold tracking-tight"
          >
            {tProductGuide("purpose.title")}
          </Typography>
          <Typography variant="caption1" className="text-muted-foreground">
            {tProductGuide("purpose.description")}
          </Typography>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PRODUCT_GUIDE_PURPOSE_POINTS.map((item) => (
            <Card key={item.id} className="border-border/70">
              <CardContent className="space-y-3 p-5">
                <div
                  className={cn(
                    "bg-muted flex size-10 items-center justify-center rounded-xl",
                    item.color
                  )}
                >
                  <Iconify icon={item.icon} className="size-5" />
                </div>
                <Typography
                  variant="subtitle2"
                  as="h3"
                  className="text-foreground text-lg font-semibold"
                >
                  {tProductGuide(`purpose.points.${item.id}.title`)}
                </Typography>
                <Typography variant="caption1" className="text-muted-foreground">
                  {tProductGuide(`purpose.points.${item.id}.description`)}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. When */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <Typography
                variant="subtitle1"
                as="h2"
                className="text-foreground text-2xl font-semibold tracking-tight"
              >
                {tProductGuide("goodFit.title")}
              </Typography>
              <Typography variant="caption1" className="text-muted-foreground">
                {tProductGuide("goodFit.description")}
              </Typography>
            </div>
            <div className="space-y-3">
              {PRODUCT_GUIDE_GOOD_FIT.map((item) => (
                <div
                  key={item.id}
                  className="border-border/60 bg-background flex items-start gap-3 rounded-xl border p-4"
                >
                  <div
                    className={cn(
                      "bg-muted mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
                      item.color
                    )}
                  >
                    <Iconify icon={item.icon} className="size-4" />
                  </div>
                  <div className="space-y-1">
                    <Typography
                      variant="label1"
                      as="h3"
                      className="text-foreground text-base font-medium"
                    >
                      {tProductGuide(`goodFit.items.${item.id}.title`)}
                    </Typography>
                    <Typography variant="caption1" className="text-muted-foreground">
                      {tProductGuide(`goodFit.items.${item.id}.description`)}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <Typography
                variant="subtitle1"
                as="h2"
                className="text-foreground text-2xl font-semibold tracking-tight"
              >
                {tProductGuide("lessSuitable.title")}
              </Typography>
              <Typography variant="caption1" className="text-muted-foreground">
                {tProductGuide("lessSuitable.description")}
              </Typography>
            </div>
            <div className="space-y-3">
              {PRODUCT_GUIDE_LESS_SUITABLE.map((item) => (
                <div
                  key={item.id}
                  className="border-border/60 bg-background flex items-start gap-3 rounded-xl border p-4"
                >
                  <div
                    className={cn(
                      "bg-muted mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
                      item.color
                    )}
                  >
                    <Iconify icon={item.icon} className="size-4" />
                  </div>
                  <div className="space-y-1">
                    <Typography
                      variant="label1"
                      as="h3"
                      className="text-foreground text-base font-medium"
                    >
                      {tProductGuide(`lessSuitable.items.${item.id}.title`)}
                    </Typography>
                    <Typography variant="caption1" className="text-muted-foreground">
                      {tProductGuide(`lessSuitable.items.${item.id}.description`)}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 5. Start here */}
      <section className="space-y-6">
        <div className="max-w-4xl space-y-2">
          <Typography
            variant="subtitle1"
            as="h2"
            className="text-foreground text-2xl font-semibold tracking-tight"
          >
            {tProductGuide("howToUse.title")}
          </Typography>
          <Typography variant="caption1" className="text-muted-foreground">
            {tProductGuide("howToUse.description")}
          </Typography>
        </div>
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          {PRODUCT_GUIDE_START_STEPS.map((step, index) => (
            <Card key={step.id} className="border-border/70 self-start">
              <CardContent className="flex min-h-[23rem] flex-col p-5">
                <div className="flex flex-1 flex-col gap-4">
                  <Badge variant="outline" className="w-fit text-xs font-medium">
                    {tProductGuide("howToUse.stepLabel", { step: index + 1 })}
                  </Badge>
                  <div
                    className={cn(
                      "bg-muted flex size-10 items-center justify-center rounded-xl",
                      step.color
                    )}
                  >
                    <Iconify icon={step.icon} className="size-5" />
                  </div>
                  <div className="space-y-3">
                    <Typography
                      variant="subtitle2"
                      as="h3"
                      className="text-foreground text-lg font-semibold"
                    >
                      {tProductGuide(`howToUse.steps.${step.id}.title`)}
                    </Typography>
                    <Typography variant="caption1" className="text-muted-foreground">
                      {tProductGuide(`howToUse.steps.${step.id}.description`)}
                    </Typography>
                  </div>

                  <Accordion type="single" collapsible className="mt-auto w-full">
                    <AccordionItem
                      value={`${step.id}-details`}
                      className="border-border/60 bg-background rounded-xl border px-3"
                    >
                      <AccordionTrigger className="py-3 text-sm no-underline hover:no-underline">
                        {tProductGuide("actions.howToAccordion")}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pt-1">
                        {(step.id === "openProject" || step.id === "startProject") && (
                          <Typography
                            variant="caption2"
                            className="border-primary/15 bg-primary/5 text-foreground rounded-xl border px-3 py-2 text-sm font-semibold"
                          >
                            {tProductGuide(`howToUse.steps.${step.id}.commandNote`)}
                          </Typography>
                        )}

                        {renderResourceLinks(step.id, step.resourceIds)}
                        {renderCommandBlocks(step.id, step.commands)}

                        {step.id === "startProject" ? (
                          <Typography
                            variant="caption2"
                            className="border-primary/15 bg-primary/5 text-muted-foreground rounded-xl border px-3 py-2 text-sm"
                          >
                            {tProductGuide.rich("howToUse.steps.startProject.note", {
                              code: (chunks) => (
                                <code className="bg-background text-foreground rounded px-1.5 py-0.5 text-xs">
                                  {chunks}
                                </code>
                              ),
                              link: (chunks) => (
                                <Link
                                  href="http://localhost:3000"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary font-medium underline underline-offset-4"
                                >
                                  {chunks}
                                </Link>
                              ),
                            })}
                          </Typography>
                        ) : null}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 6. What you can safely ignore */}
      <section className="space-y-6">
        <div className="max-w-4xl space-y-2">
          <Typography
            variant="subtitle1"
            as="h2"
            className="text-foreground text-2xl font-semibold tracking-tight"
          >
            {tProductGuide("ignoreAtFirst.title")}
          </Typography>
          <Typography variant="caption1" className="text-muted-foreground">
            {tProductGuide("ignoreAtFirst.description")}
          </Typography>
        </div>
        <Card className="border-border/70">
          <CardContent className="p-0">
            <div className="divide-border/60 divide-y">
              {GUIDE_IGNORE_FILES.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-1 p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
                >
                  <code className="text-foreground self-start rounded bg-transparent px-0 text-sm font-medium">
                    {item.file}
                  </code>
                  <Typography variant="caption1" className="text-muted-foreground">
                    {item.reason}
                  </Typography>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="border-border/60 bg-muted/30 flex items-start gap-3 rounded-xl border p-4">
          <Iconify icon="lucide:triangle-alert" className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <Typography variant="caption1" className="text-muted-foreground">
            {tProductGuide("ignoreAtFirst.doNotRemove")}
          </Typography>
        </div>
      </section>

      {/* 7. How to add a new feature */}
      <section className="space-y-6">
        <div className="max-w-5xl space-y-0">
          <Typography
            variant="subtitle1"
            as="h2"
            className="text-foreground text-2xl font-semibold tracking-tight"
          >
            {tProductGuide("addFeature.title")}
            <Typography variant="caption1" className="text-muted-foreground">
              {tProductGuide("addFeature.note")}
            </Typography>
          </Typography>
          <Typography variant="caption1" className="text-muted-foreground font-medium">
            {tProductGuide("addFeature.description")}
          </Typography>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {GUIDE_FEATURE_STEPS.map((item) => (
            <div
              key={item.step}
              className="border-border/60 bg-background flex items-start gap-3 rounded-xl border p-4"
            >
              <div className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {item.step}
              </div>
              <div className="space-y-1">
                <Typography variant="label1" className="text-foreground text-sm font-medium">
                  {item.label}
                </Typography>
                <code className="text-muted-foreground block text-xs">{item.where}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Core vs Optional */}
      <section className="space-y-6">
        <div className="max-w-4xl space-y-1">
          <Typography
            variant="subtitle1"
            as="h2"
            className="text-foreground text-2xl font-semibold tracking-tight"
          >
            {tProductGuide("coreVsOptional.title")}
          </Typography>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border-border/70">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <Iconify icon="lucide:shield" className="text-primary size-4" />
                <Typography variant="subtitle2" as="h3" className="text-foreground font-semibold">
                  {tProductGuide("coreVsOptional.coreTitle")}
                </Typography>
              </div>
              <Typography variant="caption1" className="text-muted-foreground">
                {tProductGuide("coreVsOptional.coreDescription")}
              </Typography>
              <div className="divide-border/60 divide-y">
                {GUIDE_CORE_FILES.map((item, index) => (
                  <div key={index} className="space-y-0.5 py-3 first:pt-0 last:pb-0">
                    <code className="text-foreground text-xs font-medium">{item.file}</code>
                    <Typography variant="caption2" className="text-muted-foreground block text-xs">
                      {item.why}
                    </Typography>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <Iconify icon="lucide:trash-2" className="text-muted-foreground size-4" />
                <Typography variant="subtitle2" as="h3" className="text-foreground font-semibold">
                  {tProductGuide("coreVsOptional.optionalTitle")}
                </Typography>
              </div>
              <Typography variant="caption1" className="text-muted-foreground">
                {tProductGuide("coreVsOptional.optionalDescription")}
              </Typography>
              <div className="divide-border/60 divide-y">
                {GUIDE_OPTIONAL_FILES.map((item, index) => (
                  <div key={index} className="space-y-0.5 py-3 first:pt-0 last:pb-0">
                    <code className="text-foreground text-xs font-medium">{item.file}</code>
                    <Typography variant="caption2" className="text-muted-foreground block text-xs">
                      {item.notes}
                    </Typography>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 9. Common mistakes */}
      <section className="space-y-6">
        <div className="max-w-4xl space-y-2">
          <Typography
            variant="subtitle1"
            as="h2"
            className="text-foreground text-2xl font-semibold tracking-tight"
          >
            {tProductGuide("mistakes.title")}
          </Typography>
          <Typography variant="caption1" className="text-muted-foreground">
            {tProductGuide("mistakes.description")}
          </Typography>
        </div>
        <Card className="border-border/70">
          <CardContent className="p-0">
            <div className="divide-border/60 divide-y">
              {GUIDE_MISTAKES.map((item, index) => (
                <div key={index} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <Iconify icon="lucide:x" className="text-destructive mt-0.5 size-4 shrink-0" />
                    <Typography variant="caption1" className="text-foreground text-sm">
                      {item.mistake}
                    </Typography>
                  </div>
                  <div className="flex items-start gap-2">
                    <Iconify icon="lucide:check" className="text-primary mt-0.5 size-4 shrink-0" />
                    <Typography variant="caption1" className="text-muted-foreground text-sm">
                      {item.fix}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 10. Built with */}
      <section className="space-y-6">
        <div className="max-w-4xl space-y-2">
          <Typography
            variant="subtitle1"
            as="h2"
            className="text-foreground text-2xl font-semibold tracking-tight"
          >
            {tProductGuide("builtWith.title")}
          </Typography>
          <Typography variant="caption1" className="text-muted-foreground">
            {tProductGuide("builtWith.description")}
          </Typography>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PRODUCT_GUIDE_CREDITS.map((item) => (
            <Card key={item.id} className="border-border/70">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "bg-muted flex size-10 shrink-0 items-center justify-center rounded-xl",
                      item.color
                    )}
                  >
                    <Iconify icon={item.icon} className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <Typography
                      variant="subtitle2"
                      as="h3"
                      className="text-foreground text-lg font-semibold"
                    >
                      {tProductGuide(`builtWith.items.${item.id}.name`)}
                    </Typography>
                    <Typography variant="caption1" className="text-muted-foreground">
                      {tProductGuide(`builtWith.items.${item.id}.description`)}
                    </Typography>
                  </div>
                </div>
                <Link
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary inline-flex items-center gap-2 text-sm font-medium"
                >
                  <Typography
                    variant="caption2"
                    as="span"
                    className="text-primary text-sm font-medium"
                  >
                    {tProductGuide("builtWith.linkLabel")}
                  </Typography>
                  <Iconify icon="lucide:arrow-up-right" className="size-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
