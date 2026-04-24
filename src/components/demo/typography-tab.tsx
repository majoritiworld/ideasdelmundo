"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia } from "@/components/ui/empty";
import AnimatedDivBreathing from "@/components/ui/animations/animated-div-breathing";
import AnimatedNumber from "@/components/ui/animations/animated-number";
import Iconify from "@/components/ui/iconify";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import LottiePlayer from "@/components/ui/lottie-player";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { Progress } from "@/components/ui/progress";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography, type TypoVariant } from "@/components/ui/typography";
import { useWindowSize } from "@/hooks";
import { useLoaderStore } from "@/store/loader.store";
import { cn } from "@/lib/utils";
import { inputFormatter } from "@/utils/formatters";

const VARIANT_ROWS: Array<{
  variant: TypoVariant;
  labelKey: string;
  loremKey: string;
  className?: string;
}> = [
  {
    variant: "h1",
    labelKey: "h1",
    loremKey: "heading",
    className: "text-4xl md:text-5xl",
  },
  {
    variant: "h2",
    labelKey: "h2",
    loremKey: "heading",
    className: "text-3xl md:text-4xl",
  },
  {
    variant: "h3",
    labelKey: "h3",
    loremKey: "heading",
    className: "text-2xl md:text-3xl",
  },
  { variant: "h4", labelKey: "h4", loremKey: "short" },
  { variant: "h5", labelKey: "h5", loremKey: "short" },
  { variant: "h6", labelKey: "h6", loremKey: "short" },
  { variant: "subtitle1", labelKey: "subtitle1", loremKey: "short" },
  { variant: "subtitle2", labelKey: "subtitle2", loremKey: "short" },
  { variant: "body1", labelKey: "body1", loremKey: "body" },
  { variant: "body2", labelKey: "body2", loremKey: "body" },
  { variant: "caption1", labelKey: "caption1", loremKey: "caption" },
  { variant: "caption2", labelKey: "caption2", loremKey: "caption" },
  {
    variant: "label1",
    labelKey: "label1",
    loremKey: "label",
    className: "text-foreground",
  },
  {
    variant: "label2",
    labelKey: "label2",
    loremKey: "label",
    className: "text-foreground",
  },
  { variant: "overline", labelKey: "overline", loremKey: "overline" },
];

const ICON_SAMPLES = [
  "lucide:sparkles",
  "lucide:layout-dashboard",
  "lucide:palette",
  "mdi:heart-outline",
  "logos:react",
  "lucide:rocket",
] as const;

const ICONIFY_CATALOG_URL = "https://icon-sets.iconify.design/";
const LOTTIEFILES_FREE_ANIMATIONS_URL = "https://lottiefiles.com/free-animations";

export function DemoTypographyTab() {
  const t = useTranslations("demo.typography");
  const tDemo = useTranslations("demo");
  const [progressDemo, setProgressDemo] = React.useState(38);
  const [animatedNumberReplay, setAnimatedNumberReplay] = React.useState(0);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setProgressDemo((v) => (v >= 96 ? 24 : v + 4));
    }, 900);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="border-border/60 bg-muted/20 space-y-4 border-b pb-6">
          <div className="space-y-2">
            <Typography variant="overline" as="p" className="text-muted-foreground">
              {t("eyebrow")}
            </Typography>
            <CardTitle className="text-2xl md:text-3xl">{t("title")}</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {t("description")}
            </CardDescription>
          </div>
          <div className="border-border/60 bg-background/80 rounded-xl border p-4">
            <Typography variant="subtitle2" as="p" className="text-foreground mb-2">
              {t("fontsNote.title")}
            </Typography>
            <Typography variant="caption2" as="p" color="muted" className="mb-1">
              {t("fontsNote.latin")}
            </Typography>
            <Typography variant="caption2" as="p" color="muted" className="mb-1">
              {t("fontsNote.hebrew")}
            </Typography>
            <Typography variant="caption2" as="p" color="muted">
              {t("fontsNote.arabic")}
            </Typography>
          </div>
          <div className="border-border/60 bg-background/80 rounded-xl border p-4">
            <Typography variant="subtitle2" as="p" className="text-foreground mb-2">
              {t("shadcn.title")}
            </Typography>
            <Typography variant="body2" as="p" color="muted" className="mb-3 leading-relaxed">
              {t("shadcn.description")}
            </Typography>
            <Typography variant="caption2" as="p" color="muted" className="mb-2">
              {t("shadcn.install")}
            </Typography>
            <Link
              href="https://ui.shadcn.com/docs/components"
              target="_blank"
              rel="noreferrer"
              className="text-primary inline-flex items-center gap-1 font-medium underline underline-offset-4"
            >
              {t("shadcn.docsLink")}
              <Iconify icon="lucide:arrow-up-right" className="size-3.5" />
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-10 pt-8">
          <section className="space-y-4">
            <Typography variant="subtitle2" as="h3" className="text-foreground">
              {t("showcase.typeScale")}
            </Typography>
            <div className="divide-border/60 border-border/60 bg-muted/10 space-y-0 divide-y rounded-xl border p-4 md:p-5">
              {VARIANT_ROWS.map((row) => (
                <div
                  key={row.variant}
                  className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 md:flex-row md:items-start md:gap-6"
                >
                  <Typography
                    variant="label2"
                    as="span"
                    color="muted"
                    className="shrink-0 font-medium md:w-36"
                  >
                    {t(`variants.${row.labelKey}`)}
                  </Typography>
                  <Typography
                    variant={row.variant}
                    as="div"
                    className={cn("text-foreground min-w-0 flex-1", row.className)}
                  >
                    {t(`lorem.${row.loremKey}`)}
                  </Typography>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <Typography variant="subtitle2" as="h3" className="text-foreground">
              {t("showcase.components")}
            </Typography>

            <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
              <div className="flex h-full min-h-0 flex-col gap-3">
                <Typography variant="label2" as="p" color="muted">
                  {t("showcase.iconsTitle")}
                </Typography>
                <div className="border-border/60 bg-background flex min-h-0 flex-1 flex-col gap-3 rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {ICON_SAMPLES.map((icon) => (
                      <div
                        key={icon}
                        className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl"
                      >
                        <Iconify icon={icon} className="size-6" aria-hidden />
                      </div>
                    ))}
                  </div>
                  <Typography variant="caption2" as="p" color="muted" className="mt-auto">
                    {t("showcase.iconifyCatalogIntro")}{" "}
                    <Link
                      href={ICONIFY_CATALOG_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary font-medium underline underline-offset-4"
                    >
                      {t("showcase.iconifyLinkLabel")}
                    </Link>
                    .
                  </Typography>
                </div>
              </div>

              <div className="flex h-full min-h-0 flex-col gap-3">
                <Typography variant="label2" as="p" color="muted">
                  {t("showcase.lottieTitle")}
                </Typography>
                <div className="border-border/60 bg-background flex min-h-0 flex-1 flex-col gap-3 rounded-xl border p-4">
                  <div className="flex flex-1 items-center gap-4">
                    <LottiePlayer
                      animationPath="/lottie/lottie-demo.json"
                      className="size-20 shrink-0"
                      loop
                      autoplay
                      fallback={
                        <Iconify icon="svg-spinners:3-dots-fade" className="text-primary size-12" />
                      }
                    />
                    <Typography variant="caption1" as="p" color="muted" className="leading-relaxed">
                      {t("showcase.lottieHint")}
                    </Typography>
                  </div>
                  <Typography variant="caption2" as="p" color="muted" className="mt-auto">
                    {t("showcase.lottieFilesIntro")}{" "}
                    <Link
                      href={LOTTIEFILES_FREE_ANIMATIONS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary font-medium underline underline-offset-4"
                    >
                      {t("showcase.lottieFilesLinkLabel")}
                    </Link>
                    .
                  </Typography>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Typography variant="label2" as="p" color="muted">
                {t("showcase.animationsTitle")}
              </Typography>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="border-border/60 bg-background flex flex-col gap-3 rounded-xl border p-4">
                  <Typography variant="label2" as="p" className="text-foreground">
                    {t("showcase.breathingTitle")}
                  </Typography>
                  <div className="flex flex-1 flex-col items-center justify-center gap-4 py-4">
                    <AnimatedDivBreathing className="bg-primary/15 text-primary ring-primary/20 flex size-28 items-center justify-center rounded-2xl shadow-sm ring-1">
                      <Iconify icon="lucide:activity" className="size-12" aria-hidden />
                    </AnimatedDivBreathing>
                    <Typography
                      variant="caption2"
                      as="p"
                      color="muted"
                      className="max-w-sm text-center leading-relaxed"
                    >
                      {t("showcase.breathingHint")}
                    </Typography>
                  </div>
                </div>

                <div className="border-border/60 bg-background flex flex-col gap-3 rounded-xl border p-4">
                  <Typography variant="label2" as="p" className="text-foreground">
                    {t("showcase.animatedNumberTitle")}
                  </Typography>
                  <div className="flex flex-1 flex-col items-center justify-center gap-4 py-2">
                    <div className="text-center">
                      <Typography variant="caption2" as="p" color="muted" className="mb-1">
                        {t("showcase.animatedNumberLabel")}
                      </Typography>
                      <Typography variant="h3" as="p" className="text-foreground tabular-nums">
                        <AnimatedNumber
                          key={animatedNumberReplay}
                          value={1842.37}
                          formatter={(n) => inputFormatter.dollar.format(n.toString())}
                        />
                      </Typography>
                    </div>
                    <Typography
                      variant="caption2"
                      as="p"
                      color="muted"
                      className="max-w-sm text-center leading-relaxed"
                    >
                      {t("showcase.animatedNumberHint")}
                    </Typography>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => setAnimatedNumberReplay((k) => k + 1)}
                    >
                      <Iconify icon="lucide:refresh-cw" className="size-3.5" aria-hidden />
                      <Typography variant="label2" as="span">
                        {t("showcase.animatedNumberRerun")}
                      </Typography>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Typography variant="label2" as="p" color="muted">
                {t("showcase.carouselTitle")}
              </Typography>
              <div className="border-border/60 bg-background rounded-xl border p-4">
                <Carousel className="mx-auto w-full max-w-lg">
                  <CarouselContent>
                    {(["slide1", "slide2", "slide3"] as const).map((key) => (
                      <CarouselItem key={key}>
                        <div className="bg-muted/40 flex aspect-video items-center justify-center rounded-xl border p-6">
                          <Typography variant="subtitle2" as="p" className="text-foreground">
                            {t(`showcase.${key}`)}
                          </Typography>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            </div>

            <div className="space-y-3">
              <Typography variant="label2" as="p" color="muted">
                {t("showcase.contextMenuTitle")}
              </Typography>
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <button
                    type="button"
                    className="border-border bg-muted/20 flex w-full max-w-md items-center justify-center rounded-xl border border-dashed px-4 py-10 text-center outline-none"
                  >
                    <Typography variant="body2" as="span" color="muted">
                      {t("showcase.contextMenuHint")}
                    </Typography>
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuItem>
                    <Typography variant="label2" as="span">
                      {t("showcase.contextCopy")}
                    </Typography>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <Typography variant="label2" as="span">
                      {t("showcase.contextDuplicate")}
                    </Typography>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem variant="destructive">
                    <Typography variant="label2" as="span">
                      {t("showcase.contextDelete")}
                    </Typography>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </div>

            <div className="space-y-3">
              <Typography variant="label2" as="p" color="muted">
                {t("showcase.kbdTitle")}
              </Typography>
              <div className="border-border/60 bg-background flex flex-wrap items-center gap-3 rounded-xl border p-4">
                <KbdGroup className="items-center gap-1">
                  <Kbd>⌘</Kbd>
                  <Typography variant="caption2" as="span" color="muted">
                    +
                  </Typography>
                  <Kbd>K</Kbd>
                </KbdGroup>
                <Typography variant="caption2" as="span" color="muted">
                  {t("showcase.kbdHint")}
                </Typography>
              </div>
            </div>

            <div className="space-y-3">
              <Typography variant="label2" as="p" color="muted">
                {t("showcase.badgesTitle")}
              </Typography>
              <div className="border-border/60 bg-background flex flex-wrap gap-2 rounded-xl border p-4">
                <Badge>{t("showcase.badgeDefault")}</Badge>
                <Badge variant="secondary">{t("showcase.badgeSecondary")}</Badge>
                <Badge variant="outline">{t("showcase.badgeOutline")}</Badge>
                <Badge variant="success-light">{t("showcase.badgeSuccess")}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <Typography variant="label2" as="p" color="muted">
                {t("showcase.tabsTitle")}
              </Typography>
              <div className="border-border/60 bg-background rounded-xl border p-4">
                <Tabs defaultValue="view-a" className="w-full">
                  <TabsList variant="line" className="mb-4 w-full max-w-lg justify-start">
                    <TabsTrigger value="view-a" className="gap-1.5">
                      <Iconify icon="lucide:layers" className="size-4" />
                      <Typography variant="label2" as="span" className="text-foreground">
                        {t("showcase.tabAlpha")}
                      </Typography>
                    </TabsTrigger>
                    <TabsTrigger value="view-b" className="gap-1.5">
                      <Iconify icon="lucide:box" className="size-4" />
                      <Typography variant="label2" as="span" className="text-foreground">
                        {t("showcase.tabBeta")}
                      </Typography>
                    </TabsTrigger>
                    <TabsTrigger value="view-c" className="gap-1.5">
                      <Iconify icon="lucide:orbit" className="size-4" />
                      <Typography variant="label2" as="span" className="text-foreground">
                        {t("showcase.tabGamma")}
                      </Typography>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="view-a" className="bg-muted/30 rounded-lg p-3">
                    <Typography variant="body2" as="p" color="muted">
                      {t("showcase.tabAlphaBody")}
                    </Typography>
                  </TabsContent>
                  <TabsContent value="view-b" className="bg-muted/30 rounded-lg p-3">
                    <Typography variant="body2" as="p" color="muted">
                      {t("showcase.tabBetaBody")}
                    </Typography>
                  </TabsContent>
                  <TabsContent value="view-c" className="bg-muted/30 rounded-lg p-3">
                    <Typography variant="body2" as="p" color="muted">
                      {t("showcase.tabGammaBody")}
                    </Typography>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div className="space-y-3">
              <Typography variant="label2" as="p" color="muted">
                {t("showcase.accordionTitle")}
              </Typography>
              <div className="grid gap-4 md:grid-cols-3">
                <Accordion
                  type="single"
                  collapsible
                  className="border-border/60 bg-background w-full rounded-xl border px-3"
                >
                  <AccordionItem value="a1-1">
                    <AccordionTrigger>
                      <Typography variant="label2" as="span" className="text-start">
                        {t("showcase.accordion1Trigger1")}
                      </Typography>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Typography variant="caption1" as="p" color="muted">
                        {t("showcase.accordion1Content1")}
                      </Typography>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="a1-2">
                    <AccordionTrigger>
                      <Typography variant="label2" as="span" className="text-start">
                        {t("showcase.accordion1Trigger2")}
                      </Typography>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Typography variant="caption1" as="p" color="muted">
                        {t("showcase.accordion1Content2")}
                      </Typography>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <Accordion
                  type="single"
                  collapsible
                  className="border-border/60 bg-background w-full rounded-xl border px-3"
                >
                  <AccordionItem value="a2-1">
                    <AccordionTrigger>
                      <Typography variant="label2" as="span" className="text-start">
                        {t("showcase.accordion2Trigger1")}
                      </Typography>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Typography variant="caption1" as="p" color="muted">
                        {t("showcase.accordion2Content1")}
                      </Typography>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="a2-2">
                    <AccordionTrigger>
                      <Typography variant="label2" as="span" className="text-start">
                        {t("showcase.accordion2Trigger2")}
                      </Typography>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Typography variant="caption1" as="p" color="muted">
                        {t("showcase.accordion2Content2")}
                      </Typography>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <Accordion
                  type="single"
                  collapsible
                  className="border-border/60 bg-background w-full rounded-xl border px-3"
                >
                  <AccordionItem value="a3-1">
                    <AccordionTrigger>
                      <Typography variant="label2" as="span" className="text-start">
                        {t("showcase.accordion3Trigger1")}
                      </Typography>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Typography variant="caption1" as="p" color="muted">
                        {t("showcase.accordion3Content1")}
                      </Typography>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="a3-2">
                    <AccordionTrigger>
                      <Typography variant="label2" as="span" className="text-start">
                        {t("showcase.accordion3Trigger2")}
                      </Typography>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Typography variant="caption1" as="p" color="muted">
                        {t("showcase.accordion3Content2")}
                      </Typography>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>

            <div className="space-y-3">
              <Typography variant="label2" as="p" color="muted">
                {t("showcase.loadingStatesTitle")}
              </Typography>
              <div className="border-border/60 bg-background space-y-4 rounded-xl border p-4">
                <div className="space-y-2">
                  <div className="flex justify-between gap-2">
                    <Typography variant="caption2" as="span" color="muted">
                      {t("showcase.progressFirst")}
                    </Typography>
                    <Typography variant="caption2" as="span" color="muted">
                      {progressDemo}%
                    </Typography>
                  </div>
                  <Progress value={progressDemo} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between gap-2">
                    <Typography variant="caption2" as="span" color="muted">
                      {t("showcase.progressSecond")}
                    </Typography>
                    <Typography variant="caption2" as="span" color="muted">
                      72%
                    </Typography>
                  </div>
                  <Progress value={72} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Typography variant="caption2" as="p" color="muted" className="pt-1">
                    {t("showcase.skeletonLoaderHint")}
                  </Typography>
                  <LoadingIndicator
                    variant="skeleton"
                    skeletonRows={3}
                    loadingKey="__demo_skeleton__"
                  />
                  <ViewSkeletonToggle tDemo={tDemo} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Typography variant="label2" as="p" color="muted">
                {t("showcase.resizableTitle")}
              </Typography>
              <Typography variant="caption2" as="p" color="muted" className="max-w-5xl">
                {t("showcase.resizableScrollSeparatorHint")}
              </Typography>
              <div className="border-border/60 bg-background w-full max-w-5xl rounded-xl border p-4">
                <ViewResizableScrollSeparatorDemo />
              </div>
            </div>

            <div className="space-y-3">
              <Typography variant="label2" as="p" color="muted">
                {t("showcase.emptyStateSection")}
              </Typography>
              <Empty className="border-border/80">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Iconify icon="lucide:inbox" className="size-8" />
                  </EmptyMedia>
                  <Typography variant="subtitle2" as="p" className="text-foreground">
                    {t("showcase.emptyHeading")}
                  </Typography>
                  <Typography variant="caption1" as="p" color="muted" className="max-w-md">
                    {t("showcase.emptyDescription")}
                  </Typography>
                </EmptyHeader>
                <EmptyContent>
                  <Button type="button" variant="outline" size="sm" disabled>
                    <Typography variant="label2" as="span">
                      {t("showcase.emptyAction")}
                    </Typography>
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

function ViewResizableScrollSeparatorDemo() {
  const t = useTranslations("demo.typography");
  const { width } = useWindowSize();
  const isMdUp = width >= 768;
  const orientation = width === 0 || !isMdUp ? "vertical" : "horizontal";

  return (
    <ResizablePanelGroup
      orientation={orientation}
      className={cn(
        "bg-muted/10 w-full rounded-lg border",
        orientation === "horizontal" ? "h-[min(220px,35vh)] min-h-[200px]" : "min-h-[420px]"
      )}
    >
      <ResizablePanel
        defaultSize={50}
        minSize={22}
        className={cn(
          "flex min-h-0 flex-col gap-2 p-3",
          orientation === "horizontal" && "h-[min(220px,35vh)]"
        )}
      >
        <Typography variant="label2" as="p" color="muted">
          {t("showcase.scrollTitle")}
        </Typography>
        <ScrollArea
          className={cn(
            "bg-background rounded-md border",
            orientation === "horizontal" ? "min-h-0 flex-1" : "h-40 shrink-0"
          )}
        >
          <div className="space-y-2 p-3">
            {Array.from({ length: 15 }, (_, i) => (
              <Typography key={i} variant="caption2" as="p" color="muted">
                {t("showcase.scrollLine", { n: i + 1 })}
              </Typography>
            ))}
          </div>
        </ScrollArea>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel
        defaultSize={50}
        minSize={22}
        className={cn(
          "flex min-h-0 flex-col justify-center gap-3 p-3",
          orientation === "horizontal" && "h-full"
        )}
      >
        <Typography variant="label2" as="p" color="muted">
          {t("showcase.separatorTitle")}
        </Typography>
        <Typography variant="caption2" as="p" color="muted">
          {t("showcase.separatorHint")}
        </Typography>
        <Separator />
        <div className="flex h-10 flex-wrap items-center gap-4">
          <Typography variant="label2" as="span">
            {t("showcase.separatorLeft")}
          </Typography>
          <Separator orientation="vertical" className="h-6" />
          <Typography variant="label2" as="span">
            {t("showcase.separatorRight")}
          </Typography>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function ViewSkeletonToggle({ tDemo }: { tDemo: ReturnType<typeof useTranslations<"demo">> }) {
  const add = useLoaderStore((state) => state.add);
  const remove = useLoaderStore((state) => state.remove);
  const isOn = useLoaderStore((state) => (state.keys["__demo_skeleton__"] ?? 0) > 0);

  return (
    <Button
      type="button"
      size="xs"
      variant="outline"
      className="mt-1"
      onClick={() => (isOn ? remove("__demo_skeleton__") : add("__demo_skeleton__"))}
    >
      <Typography variant="label2" as="span">
        {isOn ? tDemo("dialogs.hideSkeleton") : tDemo("dialogs.showSkeleton")}
      </Typography>
    </Button>
  );
}
