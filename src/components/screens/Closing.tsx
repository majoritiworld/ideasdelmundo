"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { useTranslations } from "next-intl";
import Sphere from "@/components/Sphere";
import { Button } from "@/components/ui/button";
import Iconify from "@/components/ui/iconify";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce, type JourneyState } from "@/lib/journey-context";
import { sendNotifyEmail } from "@/lib/notify";
import { getSectionSphereCircleColors, getSectionSphereCircleOpacities } from "@/lib/section-sphere";
import { getSectionQuestions, sections } from "@/lib/sections";
import { markCompleted, updateSession } from "@/lib/tracking";

type ClosingStep = "congrats" | "next";

const WORD_REVEAL_DELAY_MS = 60;
const SPEAKING_DURATION_MS = 9_000;
const COPY_RESET_DELAY_MS = 2_000;
const STEP_TRANSITION = { duration: 0.6, ease: "easeOut" } as const;
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

export default function Closing() {
  const { state } = useJourney();
  const t = useTranslations("journey.closing");
  const logSessionCompleted = useLogEventOnce(EVENTS.SESSION_COMPLETED);
  const [step, setStep] = useState<ClosingStep>("congrats");
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const displayName = capitalizeFirstLetter(state.name);

  const congratsBodyLine1 = t("congratsBodyLine1");
  const congratsBodyLine2 = t("congratsBodyLine2");
  const congratsBodyLine3 = t("congratsBodyLine3");
  const congratsLines = useMemo(() => {
    let wordOffset = 0;

    return [congratsBodyLine1, congratsBodyLine2, congratsBodyLine3].map((line) => {
      const words = line.split(" ");
      const offset = wordOffset;
      wordOffset += words.length;

      return { offset, words };
    });
  }, [congratsBodyLine1, congratsBodyLine2, congratsBodyLine3]);
  const congratsWordCount = useMemo(
    () => congratsLines.reduce((total, line) => total + line.words.length, 0),
    [congratsLines]
  );
  useEffect(() => {
    void logSessionCompleted();
    void markCompleted(state.sessionId);
    void updateSession(state.sessionId, { current_screen: "closing" });
    if (state.sessionId) {
      void sendNotifyEmail({
        sessionId: state.sessionId,
        name: displayName,
        email: state.email,
      }).catch((err) => {
        console.warn("[closing] completion notification failed", err);
      });
    }
  }, [displayName, logSessionCompleted, state.email, state.sessionId]);

  useEffect(() => {
    if (step !== "congrats") return;

    const timeoutId = setTimeout(() => {
      setIsSpeaking(false);
    }, SPEAKING_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, [step]);

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
              state={isSpeaking ? "speaking" : "idle"}
              size={160}
              circleColors={multicolorSphereCircleColors}
              circleOpacities={multicolorSphereCircleOpacities}
            />
            <h2 className="mt-10 font-['ArizonaFlare'] text-[38px] leading-tight font-medium text-[#0F1B2D] sm:text-[52px]">
              {t("congratsTitle", { name: displayName })}
            </h2>
            <p className="mt-6 w-full max-w-3xl text-[19px] leading-[1.75] text-[#5A6B82] sm:text-[22px]">
              {congratsLines.map((line, lineIndex) => (
                <span key={line.offset} className={lineIndex > 0 ? "block" : undefined}>
                  {line.words.map((word, wordIndex) => {
                    const revealIndex = line.offset + wordIndex;

                    return (
                      <motion.span
                        key={`${word}-${revealIndex}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          delay: (revealIndex * WORD_REVEAL_DELAY_MS) / 1000,
                          duration: 0.3,
                        }}
                      >
                        {word}
                        {wordIndex < line.words.length - 1 ? " " : ""}
                      </motion.span>
                    );
                  })}
                </span>
              ))}
            </p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: (congratsWordCount * WORD_REVEAL_DELAY_MS) / 1000,
                duration: 0.4,
              }}
            >
              <Button
                type="button"
                onClick={() => setStep("next")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-10 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98]"
              >
                {t("continueCta")}
              </Button>
            </motion.div>
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
            <Sphere
              state="idle"
              size={160}
              circleColors={multicolorSphereCircleColors}
              circleOpacities={multicolorSphereCircleOpacities}
            />
            <h2 className="mt-10 text-3xl leading-tight font-medium text-[#0F1B2D] sm:text-[40px]">
              {t("nextTitle")}
            </h2>
            <p className="mt-5 w-full max-w-3xl text-[14px] leading-[1.7] text-[#5A6B82] sm:text-[18px]">
              {t("nextBody")}
            </p>
            <div className="mt-10 flex w-full max-w-sm flex-col items-stretch gap-3">
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
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
