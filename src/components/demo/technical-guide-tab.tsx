"use client";

import enMessages from "../../../messages/en.json";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Iconify from "@/components/ui/iconify";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

type FeatureItem = {
  icon: string;
  titleKey: string;
  descriptionKey: string;
  color: string;
  items: string[];
};

type RuleItem = {
  icon: string;
  use: string;
  neverKey: string;
};

const GUIDE = enMessages.demo.guide;

const GUIDE_FEATURES: FeatureItem[] = [
  {
    icon: "lucide:zap",
    titleKey: GUIDE.features.hooks.title,
    descriptionKey: GUIDE.features.hooks.description,
    color: "text-yellow-500",
    items: [
      "useBoolean",
      "useFetch",
      "useMutation",
      "useLocalStorage",
      "useDebounce",
      "useCopyToClipboard",
      "useCountdown",
      "useOutsideClick",
      "useInView",
      "useWindowSize",
      "usePrevious",
    ],
  },
  {
    icon: "lucide:file-edit",
    titleKey: GUIDE.features.forms.title,
    descriptionKey: GUIDE.features.forms.description,
    color: "text-blue-500",
    items: [
      "TextInput",
      "FormSelect",
      "FormCombobox",
      "FormMultiSelect",
      "FormTextarea",
      "FormSwitch",
      "FormCheckbox",
      "FormOTPInput",
      "DateInput",
      "FileUpload",
      "FormattedInput",
      "Slider",
    ],
  },
  {
    icon: "lucide:server",
    titleKey: GUIDE.features.api.title,
    descriptionKey: GUIDE.features.api.description,
    color: "text-green-500",
    items: [
      "/api/proxy route",
      "useFetch (SWR GET)",
      "useMutation (POST/PUT/DELETE)",
      "Axios interceptors",
      "Global loading state",
    ],
  },
  {
    icon: "lucide:layout-panel-top",
    titleKey: GUIDE.features.ui.title,
    descriptionKey: GUIDE.features.ui.description,
    color: "text-primary",
    items: ["Button", "AppDialog", "DataTable", "StatCard", "LoadingIndicator"],
  },
];

const GOLDEN_RULES: RuleItem[] = [
  {
    icon: "lucide:toggle-right",
    use: "useBoolean",
    neverKey: GUIDE.rules.useBoolean,
  },
  {
    icon: "lucide:calendar-days",
    use: "formatDate()",
    neverKey: GUIDE.rules.formatDate,
  },
  {
    icon: "lucide:languages",
    use: "useTranslations()",
    neverKey: GUIDE.rules.useTranslations,
  },
  {
    icon: "lucide:database-zap",
    use: "useFetch()",
    neverKey: GUIDE.rules.useFetch,
  },
  {
    icon: "lucide:send",
    use: "useMutation()",
    neverKey: GUIDE.rules.useMutation,
  },
  {
    icon: "lucide:route",
    use: "API/Web route constants",
    neverKey: GUIDE.rules.apiRoutes,
  },
  {
    icon: "lucide:form-input",
    use: "Form components",
    neverKey: GUIDE.rules.forms,
  },
  {
    icon: "lucide:message-square-heart",
    use: "toastSuccess/Error",
    neverKey: GUIDE.rules.toasts,
  },
  {
    icon: "lucide:hard-drive",
    use: "useLocalStorage()",
    neverKey: GUIDE.rules.storage,
  },
];

const QUICK_DIRECTORIES = [
  { path: "src/hooks/", desc: GUIDE.quickReference.directories.hooks },
  { path: "src/components/form/", desc: GUIDE.quickReference.directories.form },
  { path: "src/utils/", desc: GUIDE.quickReference.directories.utils },
  { path: "src/lib/", desc: GUIDE.quickReference.directories.lib },
  { path: "src/store/", desc: GUIDE.quickReference.directories.store },
  { path: "src/constants/", desc: GUIDE.quickReference.directories.constants },
  { path: "src/types/", desc: GUIDE.quickReference.directories.types },
  { path: "messages/", desc: GUIDE.quickReference.directories.messages },
];

const TECH_STACK = [
  {
    layer: GUIDE.quickReference.layers.framework,
    tech: "Next.js 15 (App Router)",
  },
  { layer: GUIDE.quickReference.layers.language, tech: "TypeScript 5.9" },
  { layer: GUIDE.quickReference.layers.styling, tech: "Tailwind CSS 4" },
  { layer: GUIDE.quickReference.layers.ui, tech: "shadcn/ui + Radix UI" },
  { layer: GUIDE.quickReference.layers.forms, tech: "React Hook Form + Zod" },
  { layer: GUIDE.quickReference.layers.fetching, tech: "SWR + Axios" },
  { layer: GUIDE.quickReference.layers.state, tech: "Zustand 5" },
  { layer: GUIDE.quickReference.layers.i18n, tech: "next-intl 4.8" },
  { layer: GUIDE.quickReference.layers.charts, tech: "Recharts 3.8" },
  { layer: GUIDE.quickReference.layers.icons, tech: "Iconify" },
];

const GETTING_STARTED = [
  {
    step: "1",
    icon: "lucide:git-fork",
    title: GUIDE.gettingStarted.steps.template.title,
    description: GUIDE.gettingStarted.steps.template.description,
    code: "git clone …/skeleton-app my-app",
  },
  {
    step: "2",
    icon: "lucide:package",
    title: GUIDE.gettingStarted.steps.install.title,
    description: GUIDE.gettingStarted.steps.install.description,
    code: "pnpm install && cp .env.example .env.local",
  },
  {
    step: "3",
    icon: "lucide:rocket",
    title: GUIDE.gettingStarted.steps.build.title,
    description: GUIDE.gettingStarted.steps.build.description,
    code: "pnpm dev",
  },
];

export function DemoTechnicalGuideTab() {
  return (
    <div dir="ltr" className="space-y-12">
      <div className="from-primary/10 via-background to-primary/5 relative overflow-hidden rounded-xl border bg-gradient-to-br p-8 md:p-12">
        <div className="bg-primary/5 pointer-events-none absolute -top-16 -right-16 size-64 rounded-full blur-3xl" />
        <div className="bg-primary/8 pointer-events-none absolute -bottom-16 -left-8 size-48 rounded-full blur-2xl" />
        <div className="relative">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {["Next.js 15", "TypeScript 5", "Tailwind CSS 4", "shadcn/ui", "SWR", "React 19"].map(
              (tech) => (
                <Badge key={tech} variant="secondary" className="text-xs font-medium">
                  {tech}
                </Badge>
              )
            )}
          </div>
          <Typography
            variant="h2"
            as="h1"
            className="text-foreground text-4xl font-bold tracking-tight md:text-5xl"
          >
            skeleton-app
          </Typography>
          <Typography
            variant="body2"
            className="text-muted-foreground mt-4 max-w-2xl text-lg leading-relaxed"
          >
            {GUIDE.heroDescription}
          </Typography>
          <div className="text-muted-foreground mt-6 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Iconify icon="lucide:zap" className="size-4 text-yellow-500" />
              <Typography variant="caption2" as="span" className="text-muted-foreground text-sm">
                {GUIDE.heroStats.hooks}
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <Iconify icon="lucide:file-edit" className="size-4 text-blue-500" />
              <Typography variant="caption2" as="span" className="text-muted-foreground text-sm">
                {GUIDE.heroStats.forms}
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <Iconify icon="lucide:server" className="size-4 text-green-500" />
              <Typography variant="caption2" as="span" className="text-muted-foreground text-sm">
                {GUIDE.heroStats.api}
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <Iconify icon="lucide:bot" className="text-primary size-4" />
              <Typography variant="caption2" as="span" className="text-muted-foreground text-sm">
                {GUIDE.heroStats.claude}
              </Typography>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-6">
          <Typography
            variant="subtitle1"
            as="h2"
            className="text-foreground text-2xl font-semibold tracking-tight"
          >
            {GUIDE.whatsIncluded.title}
          </Typography>
          <Typography variant="caption1" className="text-muted-foreground mt-1">
            {GUIDE.whatsIncluded.description}
          </Typography>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {GUIDE_FEATURES.map((feature) => (
            <Card
              key={feature.titleKey}
              className="group flex flex-col transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div
                  className={cn(
                    "bg-muted mb-2 flex size-9 items-center justify-center rounded-lg",
                    feature.color
                  )}
                >
                  <Iconify icon={feature.icon} className="size-5" />
                </div>
                <CardTitle className="text-base">{feature.titleKey}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {feature.descriptionKey}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5 pt-0">
                {feature.items.map((item) => (
                  <Badge key={item} variant="secondary" className="font-mono text-[11px]">
                    {item}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6">
          <Typography
            variant="subtitle1"
            as="h2"
            className="text-foreground text-2xl font-semibold tracking-tight"
          >
            {GUIDE.goldenRules.title}
          </Typography>
          <Typography variant="caption1" className="text-muted-foreground mt-1">
            {GUIDE.goldenRules.description}{" "}
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">CLAUDE.md</code>.
          </Typography>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GOLDEN_RULES.map((rule) => (
            <div
              key={rule.use}
              className="group bg-card hover:bg-accent/50 flex gap-3 rounded-lg border p-4 transition-colors"
            >
              <div className="bg-primary/10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md">
                <Iconify icon={rule.icon} className="text-primary size-4" />
              </div>
              <div className="min-w-0 space-y-1">
                <Typography
                  variant="caption2"
                  as="p"
                  className="text-foreground font-mono text-sm leading-tight font-medium"
                >
                  {rule.use}
                </Typography>
                <Typography
                  variant="caption2"
                  as="p"
                  className="text-muted-foreground text-xs leading-relaxed"
                >
                  <Typography variant="caption2" as="span" className="text-destructive/80">
                    {GUIDE.goldenRules.neverLabel}
                  </Typography>{" "}
                  {rule.neverKey}
                </Typography>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6">
          <Typography
            variant="subtitle1"
            as="h2"
            className="text-foreground text-2xl font-semibold tracking-tight"
          >
            {GUIDE.quickReference.title}
          </Typography>
          <Typography variant="caption1" className="text-muted-foreground mt-1">
            {GUIDE.quickReference.description}
          </Typography>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Iconify icon="lucide:folder-open" className="text-muted-foreground size-4" />
                {GUIDE.quickReference.keyDirectories}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm">
                {QUICK_DIRECTORIES.map(({ path, desc }) => (
                  <div key={path} className="flex items-baseline justify-between gap-3">
                    <code className="text-primary shrink-0 text-[12px]">{path}</code>
                    <Typography
                      variant="caption2"
                      as="span"
                      className="text-muted-foreground truncate text-end text-[11px]"
                    >
                      {desc}
                    </Typography>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Iconify icon="lucide:layers" className="text-muted-foreground size-4" />
                {GUIDE.quickReference.techStack}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {TECH_STACK.map(({ layer, tech }) => (
                  <div key={layer} className="flex items-center justify-between">
                    <Typography
                      variant="caption2"
                      as="span"
                      className="text-muted-foreground text-xs"
                    >
                      {layer}
                    </Typography>
                    <Badge variant="outline" className="text-[11px] font-medium">
                      {tech}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
