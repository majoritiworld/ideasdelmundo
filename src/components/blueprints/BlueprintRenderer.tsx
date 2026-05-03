"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { BlueprintContent } from "@/lib/blueprints/types";
import { cn } from "@/lib/utils";

const ikigaiKeys = ["passion", "vocation", "mission", "profession"] as const;

type IkigaiKey = (typeof ikigaiKeys)[number];

const circleClasses: Record<IkigaiKey, string> = {
  passion: "left-1/2 top-[5%] -translate-x-1/2 bg-[#CEA41A]/30 hover:bg-[#CEA41A]/55",
  vocation: "right-[5%] top-1/2 -translate-y-1/2 bg-[#1A35CE]/25 hover:bg-[#1A35CE]/50",
  mission: "bottom-[5%] left-1/2 -translate-x-1/2 bg-[#CE1ABC]/25 hover:bg-[#CE1ABC]/50",
  profession: "left-[5%] top-1/2 -translate-y-1/2 bg-[#008925]/25 hover:bg-[#008925]/50",
};

const activeCircleClasses: Record<IkigaiKey, string> = {
  passion: "bg-[#CEA41A]/55",
  vocation: "bg-[#1A35CE]/50",
  mission: "bg-[#CE1ABC]/50",
  profession: "bg-[#008925]/50",
};

export function BlueprintRenderer({ name, content }: { name: string; content: BlueprintContent }) {
  const t = useTranslations("blueprint.page");
  const [activeIkigai, setActiveIkigai] = useState<IkigaiKey>("passion");
  const activeIkigaiContent = content.ikigai[activeIkigai];
  const firstName = useMemo(() => name.trim().split(/\s+/)[0] || name, [name]);

  return (
    <main className="min-h-screen bg-[#FAFBFE] text-[#0F1B2D]">
      <article className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
        <p className="font-mono text-[11px] tracking-[0.18em] text-[#5A6B82] uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="mt-6 font-['ArizonaFlare'] text-[64px] leading-none font-medium tracking-[-0.03em] sm:text-[96px]">
          {firstName}.
        </h1>

        <section className="mt-12 grid gap-7 text-[18px] leading-[1.85] text-[#0F1B2D]">
          {content.openingLetter.map((paragraph) => (
            <p
              key={paragraph}
              className="first:first-letter:float-left first:first-letter:pr-3 first:first-letter:font-['ArizonaFlare'] first:first-letter:text-7xl first:first-letter:leading-[0.85]"
            >
              {paragraph}
            </p>
          ))}
        </section>

        <BlueprintSection
          eyebrow={t("ikigaiEyebrow")}
          title={t("ikigaiTitle")}
          sub={t("ikigaiSub")}
        >
          <div className="mx-auto mt-10 flex max-w-xl flex-col items-center">
            <div className="relative aspect-square w-full max-w-[440px]">
              {ikigaiKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onMouseEnter={() => setActiveIkigai(key)}
                  onFocus={() => setActiveIkigai(key)}
                  onClick={() => setActiveIkigai(key)}
                  aria-label={content.ikigai[key].label}
                  className={cn(
                    "absolute size-[55%] rounded-full mix-blend-multiply transition-all duration-300",
                    circleClasses[key],
                    activeIkigai === key && ["scale-[1.03] opacity-100", activeCircleClasses[key]]
                  )}
                />
              ))}
            </div>
            <div className="mt-6 min-h-[220px] w-full rounded-[28px] border border-[#D5DCE6] bg-white p-7 shadow-[0_18px_55px_rgba(15,27,45,0.06)]">
              <p className="font-mono text-[11px] tracking-[0.16em] text-[#5A6B82] uppercase">
                {activeIkigaiContent.label}
              </p>
              <h3 className="mt-3 font-['ArizonaFlare'] text-3xl leading-tight font-medium">
                {activeIkigaiContent.title}
              </h3>
              <p className="mt-4 text-[15.5px] leading-7 text-[#5A6B82]">
                {activeIkigaiContent.body}
              </p>
            </div>
          </div>
        </BlueprintSection>

        <BlueprintSection
          eyebrow={t("tensionEyebrow")}
          title={t("tensionTitle")}
          sub={t("tensionSub")}
        >
          <div className="mt-10 grid gap-5">
            {content.tensionMap.map((tension) => (
              <div
                key={`${tension.left}-${tension.right}`}
                className="rounded-[28px] border border-[#D5DCE6] bg-white p-7"
              >
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
                  <p className="font-['ArizonaFlare'] text-3xl font-medium">{tension.left}</p>
                  <div className="h-px w-10 bg-[#D5DCE6]" />
                  <p className="font-['ArizonaFlare'] text-3xl font-medium">{tension.right}</p>
                </div>
                <p className="mt-5 text-[15px] leading-7 text-[#5A6B82]">{tension.description}</p>
              </div>
            ))}
          </div>
        </BlueprintSection>

        <BlueprintSection eyebrow={t("shadowEyebrow")} title={content.shadowSide.title}>
          <p className="mt-8 rounded-[32px] border border-[#D5DCE6] bg-white p-8 text-[18px] leading-8 text-[#0F1B2D]">
            {content.shadowSide.body}
          </p>
        </BlueprintSection>

        <BlueprintSection
          eyebrow={t("opportunitiesEyebrow")}
          title={t("opportunitiesTitle")}
          sub={t("opportunitiesSub")}
        >
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {content.opportunities.map((opportunity) => (
              <article
                key={`${opportunity.tag}-${opportunity.title}`}
                className="rounded-[24px] border border-[#D5DCE6] bg-white p-7 transition hover:-translate-y-0.5 hover:border-[#1B3DD4] hover:shadow-[0_12px_40px_rgba(27,61,212,0.08)]"
              >
                <span className="rounded-full bg-[#EEF2FE] px-3 py-1 font-mono text-[10px] tracking-[0.12em] text-[#1B3DD4] uppercase">
                  {opportunity.tag}
                </span>
                <h3 className="mt-5 font-['ArizonaFlare'] text-2xl leading-tight font-medium">
                  {opportunity.title}
                </h3>
                <p className="mt-3 text-[14.5px] leading-7 text-[#5A6B82]">{opportunity.body}</p>
              </article>
            ))}
          </div>
        </BlueprintSection>

        <section className="mt-28 rounded-[36px] bg-[#0F1B2D] px-7 py-12 text-center text-white sm:px-10">
          <p className="font-mono text-[11px] tracking-[0.18em] text-white/60 uppercase">
            {t("questionEyebrow")}
          </p>
          <p className="mt-6 font-['ArizonaFlare'] text-4xl leading-tight font-medium sm:text-5xl">
            {content.coreQuestion}
          </p>
        </section>

        <BlueprintSection eyebrow={t("booksEyebrow")} title={t("booksTitle")} sub={t("booksSub")}>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {content.books.map((book) => (
              <article key={`${book.title}-${book.author}`} className="text-center">
                <div className="mx-auto mb-5 flex aspect-[2/3] max-w-[180px] items-center justify-center rounded-xl bg-[#0F1B2D] p-5 text-white shadow-[0_12px_40px_rgba(15,27,45,0.12)]">
                  <p className="font-['ArizonaFlare'] text-2xl leading-tight">{book.title}</p>
                </div>
                <h3 className="font-['ArizonaFlare'] text-xl leading-tight font-medium">
                  {book.title}
                </h3>
                <p className="mt-1 text-sm text-[#7B8FA8]">{book.author}</p>
                <p className="mt-4 text-left text-[13.5px] leading-6 text-[#5A6B82]">{book.why}</p>
              </article>
            ))}
          </div>
        </BlueprintSection>

        <BlueprintSection
          eyebrow={t("videosEyebrow")}
          title={t("videosTitle")}
          sub={t("videosSub")}
        >
          <div className="mt-10 grid gap-5">
            {content.videos.map((video) => (
              <article
                key={`${video.title}-${video.url}`}
                className="rounded-[24px] border border-[#D5DCE6] bg-white p-7"
              >
                <p className="font-['ArizonaFlare'] text-2xl leading-tight font-medium">
                  {video.title}
                </p>
                {video.speaker ? (
                  <p className="mt-1 text-sm text-[#7B8FA8]">{video.speaker}</p>
                ) : null}
                <p className="mt-4 text-[15px] leading-7 text-[#5A6B82]">{video.why}</p>
                <Button asChild variant="outline" className="mt-5">
                  <a href={video.url} target="_blank" rel="noreferrer">
                    {t("watchVideo")}
                  </a>
                </Button>
              </article>
            ))}
          </div>
        </BlueprintSection>

        <BlueprintSection eyebrow={t("archetypeEyebrow")} title={content.careerArchetype.name}>
          <p className="mt-8 text-[18px] leading-8">{content.careerArchetype.body}</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {content.careerArchetype.examples.map((example) => (
              <article
                key={example.name}
                className="rounded-[24px] border border-[#D5DCE6] bg-white p-6"
              >
                <p className="font-medium">{example.name}</p>
                <p className="mt-3 text-[14.5px] leading-7 text-[#5A6B82]">{example.lesson}</p>
              </article>
            ))}
          </div>
        </BlueprintSection>

        <section className="mt-28 border-t border-[#D5DCE6] pt-12">
          <div className="grid gap-6 text-[17px] leading-8">
            {content.closingNote.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <p className="mt-12 font-mono text-xs tracking-[0.08em] text-[#7B8FA8]">{t("signoff")}</p>
        </section>
      </article>
    </main>
  );
}

function BlueprintSection({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-28">
      <p className="font-mono text-[11px] tracking-[0.18em] text-[#5A6B82] uppercase">{eyebrow}</p>
      <h2 className="mt-3 font-['ArizonaFlare'] text-4xl leading-tight font-medium tracking-[-0.01em]">
        {title}
      </h2>
      {sub ? <p className="mt-2 text-[15px] text-[#5A6B82]">{sub}</p> : null}
      {children}
    </section>
  );
}
