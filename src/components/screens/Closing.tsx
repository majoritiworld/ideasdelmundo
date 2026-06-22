"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { useLocale, useTranslations } from "next-intl";
import Sphere from "@/components/Sphere";
import { JourneyScreen } from "@/components/journey/screen-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Iconify from "@/components/ui/iconify";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce, type JourneyState } from "@/lib/journey-context";
import { generateArchetype, type ArchetypeResult } from "@/lib/archetype";
import { isClosingRewardPreview, PREVIEW_ARCHETYPE } from "@/lib/archetype-preview";
import {
  buildFallbackRecommendations,
  generateRecommendations,
  type VideoRecommendation,
} from "@/lib/recommendations";
import { getVideoEmbedSrc } from "@/lib/videos";
import { sendNotifyEmail } from "@/lib/notify";
import {
  getSectionSphereCircleColors,
  getSectionSphereCircleOpacities,
} from "@/lib/section-sphere";
import { getSectionQuestions, sections } from "@/lib/sections";
import { markCompleted, updateSession } from "@/lib/tracking";

const COPY_RESET_DELAY_MS = 2_000;
const STEP_TRANSITION = { duration: 0.6, ease: "easeOut" } as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const multicolorSphereCircleColors = getSectionSphereCircleColors(5);
const multicolorSphereCircleOpacities = getSectionSphereCircleOpacities(5);
const PDF_MARGIN = 40;
const PDF_FOOTER_TEXT = "Your Purpose Blueprint · @majoriti.world";
const PDF_COLORS = {
  title: "#0F1B2D",
  body: "#0F1B2D",
  muted: "#5A6B82",
  subtle: "#7B8FA8",
  divider: "#D5DCE6",
  accent: "#1B3DD4",
} as const;

function sanitizePdfFileName(name: string) {
  const safeName = name
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "");

  return `purpose-blueprint-${safeName || "guest"}.pdf`;
}

function formatGeneratedDate() {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function addPdfFooters(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(PDF_COLORS.subtle);
    doc.text(PDF_FOOTER_TEXT, pageWidth / 2, pageHeight - 22, { align: "center" });
  }
}

function createTranscriptPdf(name: string, conversations: JourneyState["conversations"]) {
  const doc = new jsPDF({ format: "a4", hotfixes: ["px_scaling"], unit: "px" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PDF_MARGIN * 2;
  const contentBottom = pageHeight - PDF_MARGIN - 28;
  let cursorY = PDF_MARGIN;

  const addPageIfNeeded = (height: number) => {
    if (cursorY + height <= contentBottom) return;

    doc.addPage();
    cursorY = PDF_MARGIN;
  };

  const addWrappedText = (
    text: string,
    options: {
      color: string;
      fontSize: number;
      fontStyle?: "normal" | "bold" | "italic";
      gapAfter?: number;
      lineHeight?: number;
    }
  ) => {
    const lineHeight = options.lineHeight ?? options.fontSize * 1.35;
    const lines = doc.splitTextToSize(text, contentWidth) as string[];

    doc.setFont("helvetica", options.fontStyle ?? "normal");
    doc.setFontSize(options.fontSize);
    doc.setTextColor(options.color);

    lines.forEach((line) => {
      addPageIfNeeded(lineHeight);
      doc.text(line, PDF_MARGIN, cursorY);
      cursorY += lineHeight;
    });

    cursorY += options.gapAfter ?? 0;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(PDF_COLORS.title);
  doc.text("Your Purpose Blueprint - Transcription", PDF_MARGIN, cursorY + 18);

  cursorY += 48;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(PDF_COLORS.muted);
  doc.text(`Prepared for ${name.trim() || "you"}`, PDF_MARGIN, cursorY);

  cursorY += 22;
  doc.setFontSize(11);
  doc.setTextColor(PDF_COLORS.subtle);
  doc.text(`Generated on ${formatGeneratedDate()}`, PDF_MARGIN, cursorY);

  cursorY += 26;
  doc.setDrawColor(PDF_COLORS.divider);
  doc.setLineWidth(1);
  doc.line(PDF_MARGIN, cursorY, pageWidth - PDF_MARGIN, cursorY);
  cursorY += 20;

  sections.forEach((section) => {
    const questionsWithConversations = getSectionQuestions(section).filter(
      (question) => conversations[question.id]?.length
    );

    if (questionsWithConversations.length === 0) return;

    cursorY += 20;
    addWrappedText(`Section ${section.id} — ${section.title}`, {
      color: PDF_COLORS.accent,
      fontSize: 13,
      fontStyle: "bold",
      gapAfter: 16,
    });

    questionsWithConversations.forEach((question) => {
      addWrappedText(`Q  ${question.text}`, {
        color: PDF_COLORS.body,
        fontSize: 11,
        fontStyle: "bold",
        gapAfter: 12,
      });

      conversations[question.id]?.forEach((message) => {
        const isUserMessage = message.role === "user";

        addWrappedText(isUserMessage ? "You" : "Guide", {
          color: isUserMessage ? PDF_COLORS.accent : PDF_COLORS.subtle,
          fontSize: 10,
          fontStyle: "bold",
          gapAfter: 4,
          lineHeight: 12,
        });
        addWrappedText(message.text, {
          color: isUserMessage ? PDF_COLORS.body : PDF_COLORS.muted,
          fontSize: 11,
          fontStyle: isUserMessage ? "normal" : "italic",
          gapAfter: 12,
        });
      });

      cursorY += 8;
    });
  });

  addPdfFooters(doc);
  doc.save(sanitizePdfFileName(name));
}

function capitalizeFirstLetter(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function serializeTranscript(name: string, conversations: JourneyState["conversations"]) {
  const serializedConversations = sections.flatMap((section) =>
    getSectionQuestions(section)
      .filter((question) => conversations[question.id]?.length)
      .map((question) => ({
        section: section.title,
        questionId: question.id,
        question: question.text,
        messages: conversations[question.id],
      }))
  );

  return JSON.stringify(
    {
      name: name.trim(),
      conversations: serializedConversations,
    },
    null,
    2
  );
}

export default function Closing() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.closing");
  const locale = useLocale();
  const logSessionCompleted = useLogEventOnce(EVENTS.SESSION_COMPLETED);
  const rewardPreview = isClosingRewardPreview();
  const [isReflecting, setIsReflecting] = useState(false);
  const [archetype, setArchetype] = useState<ArchetypeResult | null>(() =>
    rewardPreview ? PREVIEW_ARCHETYPE : null
  );
  const [archetypeError, setArchetypeError] = useState(false);
  const [recommendations, setRecommendations] = useState<VideoRecommendation[] | null>(() =>
    rewardPreview ? buildFallbackRecommendations() : null
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState(() =>
    rewardPreview ? state.email || "preview@majoriti.world" : state.email
  );
  const [emailStatus, setEmailStatus] = useState<"idle" | "success">(() =>
    rewardPreview ? "success" : "idle"
  );
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const archetypeRequestedRef = useRef(false);
  const recommendationsRequestedRef = useRef(false);
  const displayName = capitalizeFirstLetter(state.name);

  const isEmailSubmitted = emailStatus === "success";
  const sphereState = isEmailSubmitted
    ? archetypeError
      ? "idle"
      : isReflecting
        ? "thinking"
        : archetype
          ? "speaking"
          : "idle"
    : isReflecting
      ? "thinking"
      : "idle";

  useEffect(() => {
    if (rewardPreview) return;

    void logSessionCompleted();
    void markCompleted(state.sessionId);
    void updateSession(state.sessionId, { current_screen: "closing" });
  }, [logSessionCompleted, rewardPreview, state.sessionId]);

  useEffect(() => {
    if (rewardPreview) {
      archetypeRequestedRef.current = true;
      dispatch({ type: "SET_ARCHETYPE", archetypeName: PREVIEW_ARCHETYPE.archetypeName });
      return;
    }

    if (archetypeRequestedRef.current) return;

    archetypeRequestedRef.current = true;
    setIsReflecting(true);
    setArchetypeError(false);

    void generateArchetype({
      name: displayName,
      transcript: serializeTranscript(displayName, state.conversations),
    })
      .then((archetypeResult) => {
        setArchetype(archetypeResult);
        dispatch({ type: "SET_ARCHETYPE", archetypeName: archetypeResult.archetypeName });
        void updateSession(state.sessionId, {
          draft_report: JSON.stringify(archetypeResult),
        });
      })
      .catch((err) => {
        console.warn("[closing] archetype generation failed", err);
        setArchetypeError(true);
      })
      .finally(() => {
        setIsReflecting(false);
      });
  }, [dispatch, displayName, rewardPreview, state.conversations, state.sessionId]);

  useEffect(() => {
    if (rewardPreview) return;
    if (recommendationsRequestedRef.current) return;

    recommendationsRequestedRef.current = true;

    void generateRecommendations({
      transcript: serializeTranscript(displayName, state.conversations),
      locale,
    })
      .then((result) => {
        setRecommendations(result.recommendations);
      })
      .catch((err) => {
        console.warn("[closing] recommendations failed", err);
        setRecommendations(buildFallbackRecommendations());
      });
  }, [displayName, locale, rewardPreview, state.conversations]);

  useEffect(() => {
    if (!copied) return;

    const timeoutId = setTimeout(() => {
      setCopied(false);
    }, COPY_RESET_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [copied]);

  const downloadTranscript = () => {
    createTranscriptPdf(displayName, state.conversations);
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(t("shareMessage", { origin: window.location.origin }));
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
  };

  const sendBlueprintEmail = async () => {
    const cleanEmail = email.trim();

    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setEmailError(t("invalidEmail"));
      return;
    }

    setIsSendingEmail(true);
    setEmailError(null);

    try {
      await updateSession(state.sessionId, { email: cleanEmail });
      dispatch({ type: "SET_EMAIL", email: cleanEmail });
      await sendNotifyEmail({
        sessionId: state.sessionId,
        name: state.name,
        email: cleanEmail,
      });
      setEmailStatus("success");
    } catch (err) {
      console.warn("[closing] notification request failed", err);
      setEmailError(t("notifyError"));
    } finally {
      setIsSendingEmail(false);
    }
  };

  const emailGateSection = (
    <div className="mt-8 flex w-full max-w-[480px] flex-col items-center">
      <h2 className="text-center font-['ArizonaFlare'] text-[clamp(26px,4.5vw,34px)] leading-tight font-medium text-[#0F1B2D]">
        {t("emailSectionTitle")}
      </h2>
      <p className="mt-4 text-center text-[15px] leading-[1.7] text-[#5A6B82] sm:text-[17px]">
        {t("nextBody")}
      </p>
      <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (emailError) setEmailError(null);
          }}
          placeholder={t("emailPlaceholder")}
          className="h-12 rounded-full border-[#D5DCE6] bg-white px-5 text-[15px] text-[#0F1B2D] shadow-none"
          aria-label={t("emailPlaceholder")}
        />
        <Button
          type="button"
          onClick={() => void sendBlueprintEmail()}
          disabled={isSendingEmail}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 shrink-0 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
        >
          {t("notifyCta")}
        </Button>
      </div>
      {emailError ? (
        <p className="mt-3 text-center text-[14px] font-medium text-[#D85A30]">{emailError}</p>
      ) : null}
    </div>
  );

  const confirmationSection = (
    <div className="mt-8 flex w-full max-w-[520px] flex-col items-center">
      <div className="w-full rounded-[20px] border border-[#1D9E75]/25 bg-[#1D9E75]/8 px-6 py-5 text-center">
        <p className="text-[15px] leading-[1.75] font-medium text-[#0F1B2D] sm:text-[16px]">
          {archetypeError ? t("notifySuccessFallback") : t("notifySuccess")}
        </p>
      </div>
    </div>
  );

  const recommendationsSection = (
    <div className="mt-10 flex w-full flex-col items-center">
      <p className="max-w-2xl text-center text-[15px] leading-[1.7] text-[#5A6B82] sm:text-[17px]">
        {t("videosIntro")}
      </p>

      {recommendations ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={STEP_TRANSITION}
          className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-6"
        >
          {recommendations.flatMap((recommendation) => {
            const embedSrc = getVideoEmbedSrc(recommendation.video);

            // Never render a broken iframe: skip entries that resolve to no
            // embeddable URL (the route already backfills DEFAULT_FALLBACK).
            if (!embedSrc) return [];

            return [
              <article
                key={recommendation.video.id}
                className="overflow-hidden rounded-[20px] border border-[#D5DCE6] bg-white/55 text-start"
              >
                <div className="aspect-video w-full bg-[#0F1B2D]" dir="ltr">
                  <iframe
                    src={embedSrc}
                    title={recommendation.video.title}
                    loading="lazy"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
                <div className="p-6">
                  <p className="font-mono text-[10px] tracking-[0.16em] text-[#5A6B82] uppercase">
                    {recommendation.video.type === "ted" ? t("videoTagTed") : t("videoTagYoutube")}
                  </p>
                  <h3 className="mt-3 font-['ArizonaFlare'] text-[18px] leading-tight font-medium text-[#0F1B2D]">
                    {recommendation.video.title}
                  </h3>
                  <p className="mt-1 text-[13px] text-[#7B8FA8]">{recommendation.video.creator}</p>
                  {recommendation.why ? (
                    <p className="mt-4 text-[14px] leading-[1.65] text-[#5A6B82]">
                      {recommendation.why}
                    </p>
                  ) : null}
                </div>
              </article>,
            ];
          })}
        </motion.div>
      ) : (
        <p className="mt-8 text-center text-[15px] text-[#7B8FA8]">{t("videosLoading")}</p>
      )}
    </div>
  );

  const extrasSection = (
    <>
      <div className="mt-10 h-px w-full max-w-md bg-[#D5DCE6]" />

      <div className="mt-8 flex w-full max-w-sm flex-col items-stretch gap-3">
        <Button
          type="button"
          onClick={downloadTranscript}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98]"
        >
          {t("downloadCta")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShareOpen((isOpen) => !isOpen)}
          className="h-12 rounded-full border-[#D5DCE6] text-[#5A6B82] transition-all hover:-translate-y-px hover:bg-white hover:text-[#0F1B2D] active:scale-[0.98]"
        >
          {t("shareCta")}
        </Button>
        <AnimatePresence>
          {shareOpen ? (
            <motion.div
              key="share-panel"
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={STEP_TRANSITION}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 rounded-[28px] border border-[#D5DCE6] bg-white/70 p-2 shadow-[0_18px_55px_rgba(15,27,45,0.08)]">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={shareOnWhatsApp}
                  className="h-11 justify-start rounded-full px-4 text-[#5A6B82] hover:bg-[#F3F6FA] hover:text-[#0F1B2D]"
                >
                  <Iconify icon="logos:whatsapp-icon" className="size-4" />
                  {t("whatsappCta")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void copyLink()}
                  className="h-11 justify-start rounded-full px-4 text-[#5A6B82] hover:bg-[#F3F6FA] hover:text-[#0F1B2D]"
                >
                  <Iconify icon="lucide:link" className="size-4" />
                  {copied ? t("copiedCta") : t("copyLinkCta")}
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <a
        href="https://instagram.com/majoriti.world"
        target="_blank"
        rel="noreferrer"
        className="mt-8 text-center font-mono text-[13px] text-[#7B8FA8] transition-colors hover:text-[#5A6B82]"
      >
        {t("footer")}
      </a>
    </>
  );

  return (
    <JourneyScreen>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={STEP_TRANSITION}
        className="flex w-full flex-col items-center"
      >
        <Sphere
          state={sphereState}
          size={160}
          circleColors={multicolorSphereCircleColors}
          circleOpacities={multicolorSphereCircleOpacities}
        />
        {!isEmailSubmitted ? (
          emailGateSection
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={STEP_TRANSITION}
            className="flex w-full flex-col items-center"
          >
            {confirmationSection}

            {recommendationsSection}

            {extrasSection}
          </motion.div>
        )}
      </motion.div>
    </JourneyScreen>
  );
}
