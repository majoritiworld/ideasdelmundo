"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { useTranslations } from "next-intl";
import Sphere from "@/components/Sphere";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Iconify from "@/components/ui/iconify";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce, type JourneyState } from "@/lib/journey-context";
import { generateArchetype, type ArchetypeResult } from "@/lib/archetype";
import { sendNotifyEmail } from "@/lib/notify";
import {
  getSectionSphereCircleColors,
  getSectionSphereCircleOpacities,
} from "@/lib/section-sphere";
import { getSectionQuestions, sections } from "@/lib/sections";
import { markCompleted, updateSession } from "@/lib/tracking";

type ClosingStep = "congrats" | "next";

const WORD_REVEAL_DELAY_MS = 60;
const ARCHETYPE_WORD_REVEAL_DELAY_MS = 55;
const INTRO_PAUSE_MS = 800;
const NAME_PAUSE_MS = 600;
const DESCRIPTION_PAUSE_MS = 400;
const REFERENCE_FADE_DURATION_MS = 1_200;
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

function getWordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function sanitizePngFileName(name: string) {
  const safeName = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${safeName || "guest"}-archetype-card.png`;
}

function WordReveal({
  text,
  delayMs = 0,
  wordDelayMs,
}: {
  text: string;
  delayMs?: number;
  wordDelayMs: number;
}) {
  const words = useMemo(() => text.split(" ").filter(Boolean), [text]);

  return (
    <>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: (delayMs + index * wordDelayMs) / 1000,
            duration: 0.3,
          }}
        >
          {word}
          {index < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </>
  );
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

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(/\s+/).filter(Boolean);
  let line = "";
  let cursorY = y;

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    const metrics = context.measureText(testLine);

    if (metrics.width > maxWidth && line) {
      context.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
      return;
    }

    line = testLine;
  });

  if (line) {
    context.fillText(line, x, cursorY);
  }
}

function downloadArchetypeCard(name: string, archetype: ArchetypeResult) {
  const canvas = document.createElement("canvas");
  canvas.width = 1920;
  canvas.height = 1080;

  const context = canvas.getContext("2d");
  if (!context) return;

  context.fillStyle = "#0F1B2D";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(255,255,255,0.03)";
  context.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 80) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 80) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }

  [
    { x: 1580, y: 500, color: "rgba(206,164,26,0.18)" },
    { x: 1720, y: 500, color: "rgba(26,53,206,0.18)" },
    { x: 1650, y: 420, color: "rgba(206,26,188,0.18)" },
    { x: 1650, y: 560, color: "rgba(0,137,37,0.18)" },
  ].forEach((circle) => {
    context.beginPath();
    context.fillStyle = circle.color;
    context.arc(circle.x, circle.y, 130, 0, Math.PI * 2);
    context.fill();
  });

  context.fillStyle = "#5A6B82";
  context.font = '18px "Courier New", monospace';
  context.fillText("YOUR ARCHETYPE · MAJORITI", 120, 155);

  context.fillStyle = "#CEA41A";
  context.fillRect(120, 180, 100, 4);

  context.fillStyle = "#FAFBFE";
  context.font = 'bold 110px Georgia, "Times New Roman", serif';
  context.fillText(`${name.trim() || "You"}.`, 120, 340);

  context.fillStyle = "#CEA41A";
  context.font = 'italic bold 76px Georgia, "Times New Roman", serif';
  context.fillText(archetype.archetypeName, 120, 460);

  context.strokeStyle = "rgba(250,251,254,0.1)";
  context.beginPath();
  context.moveTo(0, 500);
  context.lineTo(canvas.width, 500);
  context.stroke();

  context.fillStyle = "rgba(250,251,254,0.65)";
  context.font = '30px Georgia, "Times New Roman", serif';
  wrapCanvasText(context, archetype.archetypeDescription, 120, 580, 1500, 50);

  context.strokeStyle = "rgba(250,251,254,0.1)";
  context.beginPath();
  context.moveTo(0, 980);
  context.lineTo(canvas.width, 980);
  context.stroke();

  context.fillStyle = "#5A6B82";
  context.font = '20px "Courier New", monospace';
  context.fillText("@majoriti.world", 120, 1020);

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = sanitizePngFileName(name);
  link.click();
}

export default function Closing() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.closing");
  const logSessionCompleted = useLogEventOnce(EVENTS.SESSION_COMPLETED);
  const [step, setStep] = useState<ClosingStep>("congrats");
  const [isReflecting, setIsReflecting] = useState(false);
  const [archetype, setArchetype] = useState<ArchetypeResult | null>(null);
  const [archetypeError, setArchetypeError] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState(state.email);
  const [emailStatus, setEmailStatus] = useState<"idle" | "success">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const archetypeRequestedRef = useRef(false);
  const displayName = capitalizeFirstLetter(state.name);

  const introText = t("archetypeIntro");
  const introWordCount = useMemo(() => getWordCount(introText), [introText]);
  const nameRevealText = archetype
    ? t("archetypeReveal", { archetypeName: archetype.archetypeName })
    : "";
  const nameRevealDelayMs = 0;
  const descriptionRevealDelayMs =
    nameRevealDelayMs +
    getWordCount(nameRevealText) * ARCHETYPE_WORD_REVEAL_DELAY_MS +
    NAME_PAUSE_MS;
  const purposeRevealDelayMs = archetype
    ? descriptionRevealDelayMs +
      getWordCount(archetype.archetypeDescription) * ARCHETYPE_WORD_REVEAL_DELAY_MS +
      DESCRIPTION_PAUSE_MS
    : 0;
  const referencesRevealDelayMs = archetype
    ? purposeRevealDelayMs +
      getWordCount(archetype.purposeStatement) * ARCHETYPE_WORD_REVEAL_DELAY_MS
    : 0;
  const ctaRevealDelayMs = referencesRevealDelayMs + REFERENCE_FADE_DURATION_MS;
  const sphereState = archetypeError ? "idle" : isReflecting ? "thinking" : "speaking";

  useEffect(() => {
    void logSessionCompleted();
    void markCompleted(state.sessionId);
    void updateSession(state.sessionId, { current_screen: "closing" });
  }, [logSessionCompleted, state.sessionId]);

  useEffect(() => {
    if (step !== "congrats") return;
    if (archetypeRequestedRef.current) return;

    const timeoutId = setTimeout(
      () => {
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
      },
      introWordCount * WORD_REVEAL_DELAY_MS + INTRO_PAUSE_MS
    );

    return () => clearTimeout(timeoutId);
  }, [dispatch, displayName, introWordCount, state.conversations, state.sessionId, step]);

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

  const handleDownloadArchetypeCard = useCallback(() => {
    if (!archetype) return;
    downloadArchetypeCard(displayName, archetype);
  }, [archetype, displayName]);

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-5 py-8 text-center sm:px-8">
      <AnimatePresence mode="wait">
        {step === "congrats" ? (
          <motion.div
            key="congrats"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={STEP_TRANSITION}
            className="flex w-full flex-col items-center"
          >
            <Sphere
              state={sphereState}
              size={160}
              circleColors={multicolorSphereCircleColors}
              circleOpacities={multicolorSphereCircleOpacities}
            />
            <p className="mt-10 text-[19px] leading-[1.75] text-[#5A6B82] sm:text-[22px]">
              <WordReveal text={introText} wordDelayMs={WORD_REVEAL_DELAY_MS} />
            </p>

            <AnimatePresence mode="wait">
              {isReflecting ? (
                <motion.p
                  key="reflecting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-5 text-[13px] text-[#7B8FA8]"
                >
                  {t("reflecting")}
                </motion.p>
              ) : null}
            </AnimatePresence>

            {archetype ? (
              <div className="mt-8 flex w-full flex-col items-center">
                <h2 className="max-w-3xl text-center font-['ArizonaFlare'] text-[clamp(28px,5vw,42px)] leading-tight font-medium text-[#0F1B2D]">
                  <WordReveal
                    text={nameRevealText}
                    delayMs={nameRevealDelayMs}
                    wordDelayMs={ARCHETYPE_WORD_REVEAL_DELAY_MS}
                  />
                </h2>

                <p className="mt-6 w-full max-w-3xl text-[16px] leading-[1.75] text-[#5A6B82] sm:text-[19px]">
                  <WordReveal
                    text={archetype.archetypeDescription}
                    delayMs={descriptionRevealDelayMs}
                    wordDelayMs={ARCHETYPE_WORD_REVEAL_DELAY_MS}
                  />
                </p>

                <p className="mt-6 w-full max-w-2xl font-['ArizonaFlare'] text-[24px] leading-tight font-medium text-[#5A6B82] italic sm:text-[30px]">
                  <WordReveal
                    text={archetype.purposeStatement}
                    delayMs={purposeRevealDelayMs}
                    wordDelayMs={ARCHETYPE_WORD_REVEAL_DELAY_MS}
                  />
                </p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: referencesRevealDelayMs / 1000,
                    duration: REFERENCE_FADE_DURATION_MS / 1000,
                  }}
                  className="mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2"
                >
                  {archetype.references.map((reference) => (
                    <article
                      key={reference.name}
                      className="rounded-[20px] border border-[#D5DCE6] bg-white/55 p-6 text-left"
                    >
                      <h3 className="font-['ArizonaFlare'] text-[18px] leading-tight font-medium text-[#0F1B2D]">
                        {reference.name}
                      </h3>
                      <p className="mt-2 font-mono text-[10px] tracking-[0.16em] text-[#5A6B82] uppercase">
                        {reference.descriptor}
                      </p>
                      <p className="mt-4 text-[14px] leading-[1.65] text-[#5A6B82]">
                        {reference.connection}
                      </p>
                    </article>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: ctaRevealDelayMs / 1000, duration: 0.5 }}
                  className="mt-9 flex w-full flex-col items-center"
                >
                  <Button
                    type="button"
                    onClick={handleDownloadArchetypeCard}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-full px-7 font-mono transition-all hover:-translate-y-px active:scale-[0.98]"
                  >
                    {t("downloadArchetypeCardCta")}
                  </Button>

                  <div className="mt-9 h-px w-full max-w-md bg-[#D5DCE6]" />
                  <p className="mt-7 max-w-[480px] text-center text-[15px] leading-[1.7] text-[#5A6B82]">
                    {t("humanReviewMessage")}
                  </p>

                  <Button
                    type="button"
                    onClick={() => setStep("next")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 mt-8 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98]"
                  >
                    {t("continueCta")}
                  </Button>
                </motion.div>
              </div>
            ) : null}

            {archetypeError ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="mt-8 flex flex-col items-center"
              >
                <p className="max-w-md text-[15px] leading-[1.7] text-[#5A6B82]">
                  {t("archetypeError")}
                </p>
                <Button
                  type="button"
                  onClick={() => setStep("next")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 mt-8 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98]"
                >
                  {t("continueCta")}
                </Button>
              </motion.div>
            ) : null}
          </motion.div>
        ) : (
          <motion.div
            key="next"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={STEP_TRANSITION}
            className="flex w-full flex-col items-center"
          >
            <h2 className="font-['ArizonaFlare'] text-[28px] leading-tight font-medium text-[#0F1B2D]">
              {t("nextTitle")}
            </h2>
            <p className="mt-5 w-full max-w-[480px] text-center text-[15px] leading-[1.7] text-[#5A6B82]">
              {t("nextBody")}
            </p>

            <div className="mt-8 flex w-full max-w-[480px] flex-col items-center">
              {emailStatus === "success" ? (
                <p className="text-center text-[15px] font-medium text-[#1D9E75]">
                  {t("notifySuccess")}
                </p>
              ) : (
                <div className="flex w-full flex-col gap-3 sm:flex-row">
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
              )}

              {emailError ? (
                <p className="mt-3 text-center text-[14px] font-medium text-[#D85A30]">
                  {emailError}
                </p>
              ) : null}
            </div>

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
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
