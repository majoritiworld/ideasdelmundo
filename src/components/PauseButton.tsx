"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import API_ROUTES from "@/constants/api-routes.constants";
import { useMutation } from "@/hooks/use-mutation";
import { useJourney } from "@/lib/journey-context";

type PauseStep = "idle" | "email" | "sent";
type PausePayload = {
  sessionId: string | null;
  name: string;
  email: string;
};

export default function PauseButton() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.pause");
  const [step, setStep] = useState<PauseStep>("idle");
  const [email, setEmail] = useState(state.email);
  const [error, setError] = useState<string | null>(null);
  const { trigger, isMutating } = useMutation<{ ok: boolean }, PausePayload>(API_ROUTES.PAUSE);

  if (!state.sessionId || state.coreAnswered.length < 1) return null;

  async function handlePause() {
    const finalEmail = email.trim() || state.email.trim();

    if (!finalEmail) {
      setStep("email");
      return;
    }

    setError(null);

    try {
      await trigger({
        method: "POST",
        data: {
          sessionId: state.sessionId,
          name: state.name,
          email: finalEmail,
        },
      });

      dispatch({ type: "SET_EMAIL", email: finalEmail });
      setStep("sent");
    } catch (err) {
      console.error("[PauseButton]", err);
      setError(t("error"));
    }
  }

  if (step === "sent") {
    return (
      <div className="fixed top-5 right-5 z-[100] max-w-[280px] rounded-2xl border border-[#D5DCE6] bg-white px-5 py-4 shadow-[0_8px_30px_rgba(15,27,45,0.08)]">
        <div className="mb-2 font-mono text-[10px] tracking-[0.15em] text-[#1D9E75] uppercase">
          {t("savedLabel")}
        </div>
        <div className="text-[13px] leading-[1.6] text-[#0F1B2D]">{t("sentMessage")}</div>
      </div>
    );
  }

  if (step === "email") {
    const isEmailValid = email.includes("@");

    return (
      <div className="fixed top-5 right-5 z-[100] max-w-[280px] rounded-2xl border border-[#D5DCE6] bg-white p-4 shadow-[0_8px_30px_rgba(15,27,45,0.08)]">
        <div className="mb-2.5 text-[13px] text-[#5A6B82]">{t("emailPrompt")}</div>
        <Input
          type="email"
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("emailPlaceholder")}
          className="mb-2 h-auto rounded-full border-[#D5DCE6] px-3.5 py-2.5 text-[13px] shadow-none"
        />
        {error ? <p className="mb-2 text-[12px] leading-5 text-[#D85A30]">{error}</p> : null}
        <Button
          type="button"
          onClick={() => void handlePause()}
          disabled={!isEmailValid || isMutating}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-auto w-full rounded-full px-4 py-2.5 font-mono text-[11px] tracking-[0.1em] uppercase disabled:opacity-40"
        >
          {isMutating ? t("saving") : t("sendLink")}
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => void handlePause()}
      disabled={isMutating}
      className="fixed top-5 right-5 z-[100] h-auto rounded-full border border-[#D5DCE6] bg-transparent px-4 py-2 font-mono text-[11px] tracking-[0.1em] text-[#5A6B82] uppercase transition-all hover:border-[#0F1B2D] hover:bg-transparent hover:text-[#0F1B2D]"
    >
      {isMutating ? t("saving") : t("pause")}
    </Button>
  );
}
