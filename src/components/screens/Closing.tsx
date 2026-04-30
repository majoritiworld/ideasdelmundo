"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Sphere from "@/components/Sphere";
import { Button } from "@/components/ui/button";
import Iconify from "@/components/ui/iconify";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce, type JourneyState } from "@/lib/journey-context";
import { sections } from "@/lib/sections";
import { markCompleted, updateSession } from "@/lib/tracking";
import { useAudio } from "@/lib/useAudio";

type ClosingStep = "congrats" | "next";

const WORD_REVEAL_DELAY_MS = 60;
const SPEAKING_DURATION_MS = 9_000;
const COPY_RESET_DELAY_MS = 2_000;
const STEP_TRANSITION = { duration: 0.6, ease: "easeOut" } as const;

function buildTranscript(conversations: JourneyState["conversations"]) {
  const lines = ["YOUR PURPOSE BLUEPRINT — TRANSCRIPT", "====================================", ""];

  sections.forEach((section) => {
    const questionBlocks = section.questions
      .map((question) => {
        const messages = conversations[question.id];
        if (!messages?.length) return null;

        return [
          `Q: ${question.text}`,
          ...messages.map(
            (message) => `${message.role === "user" ? "You" : "Guide"}: ${message.text}`
          ),
        ].join("\n");
      })
      .filter((block): block is string => block !== null);

    if (questionBlocks.length === 0) return;

    const sectionHeading = `SECTION ${section.id}: ${section.title}`;
    lines.push(sectionHeading, "-".repeat(sectionHeading.length), ...questionBlocks, "");
  });

  return lines.join("\n");
}

export default function Closing() {
  const { state } = useJourney();
  const t = useTranslations("journey.closing");
  const logSessionCompleted = useLogEventOnce(EVENTS.SESSION_COMPLETED);
  const [step, setStep] = useState<ClosingStep>("congrats");
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  useAudio("/audio/closing-1.mp3");

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
  }, [logSessionCompleted, state.sessionId]);

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
    const transcript = buildTranscript(state.conversations);
    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "purpose-transcript.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
            <Sphere state={isSpeaking ? "speaking" : "idle"} size={160} />
            <h2 className="mt-10 font-['ArizonaFlare'] text-[38px] leading-tight font-medium text-[#0F1B2D] sm:text-[52px]">
              {t("congratsTitle", { name: state.name })}
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
                className="mt-10 h-12 rounded-full bg-primary px-7 text-primary-foreground transition-all hover:-translate-y-px hover:bg-primary/90 active:scale-[0.98]"
              >
                {t("continueCta")}
              </Button>
            </motion.div>
            <p className="mt-12 text-sm font-medium text-[#7B8FA8]">{t("footer")}</p>
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
            <Sphere state="idle" size={160} />
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
                className="h-12 rounded-full bg-primary px-7 text-primary-foreground transition-all hover:-translate-y-px hover:bg-primary/90 active:scale-[0.98]"
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
            <p className="mt-12 text-sm font-medium text-[#7B8FA8]">{t("footer")}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
