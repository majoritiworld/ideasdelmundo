"use client";

import { type FormEvent, useState } from "react";
import { useTranslations } from "next-intl";

import IkigaiFigure from "@/components/IkigaiFigure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJourney } from "@/lib/journey-context";
import { supabase } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.35 0-4.34-1.58-5.05-3.72H.94v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7a5.41 5.41 0 0 1 0-3.4V4.97H.94a9 9 0 0 0 0 8.06l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.43 1.34l2.6-2.6A8.74 8.74 0 0 0 9 0 9 9 0 0 0 .94 4.97L3.95 7.3C4.66 5.16 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

export default function Login() {
  const { state, dispatch } = useJourney();
  const t = useTranslations("journey.login");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailReady = email.trim().length > 0;
  const isSignedIn = state.authChecked && Boolean(state.userId);

  async function signInWithGoogle() {
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signInError) setError(t("error"));
  }

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(t("error"));
      return;
    }

    setSent(true);
  }

  function continueSession() {
    if (state.resumeSession) {
      dispatch({ type: "HYDRATE_RESUME", session: state.resumeSession });
      return;
    }

    dispatch({ type: "GO_TO", screen: "welcome" });
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-5 py-8 text-center sm:px-8">
      <IkigaiFigure size={160} />
      <h1 className="font-heading mt-10 text-[38px] leading-tight font-medium text-[#0F1B2D] sm:text-[52px]">
        {isSignedIn ? (
          t("returningTitle")
        ) : (
          <>
            {t("titleLine1")}
            <br />
            {t("titleLine2")}
          </>
        )}
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-[1.65] text-[#5A6B82] sm:text-[20px]">
        {t(isSignedIn ? "returningSubtitle" : "subtitle")}
      </p>

      {isSignedIn ? (
        <Button
          type="button"
          onClick={continueSession}
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-8 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98]"
        >
          {t("continueSession")}
        </Button>
      ) : (
        <div className="mt-8 flex w-full max-w-sm flex-col items-stretch gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => void signInWithGoogle()}
            className="h-12 rounded-full border-[#D5DCE6] bg-white px-7 text-[#0F1B2D] shadow-none transition-all hover:-translate-y-px hover:bg-white active:scale-[0.98]"
          >
            <GoogleIcon />
            {t("googleCta")}
          </Button>

          {sent ? (
            <p className="rounded-[28px] bg-white/70 px-5 py-4 text-sm font-medium text-[#1D9E75] shadow-[0_18px_55px_rgba(15,27,45,0.08)]">
              {t("magicSent")}
            </p>
          ) : (
            <form onSubmit={(event) => void sendMagicLink(event)} className="flex flex-col gap-3">
              <label htmlFor="login-email" className="text-sm font-light text-[#5A6B82]">
                {t("emailLabel")}
              </label>
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError(null);
                }}
                placeholder={t("emailPlaceholder")}
                className="h-12 border-[#D5DCE6] bg-white px-5 text-[15px] text-[#0F1B2D] shadow-none"
                aria-required
              />
              <Button
                type="submit"
                disabled={!emailReady || isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98] disabled:cursor-not-allowed"
              >
                {t("emailCta")}
              </Button>
            </form>
          )}

          {error ? <p className="text-sm font-medium text-[#D85A30]">{error}</p> : null}

          <button
            type="button"
            onClick={() => dispatch({ type: "GO_TO", screen: "welcome" })}
            className="text-sm text-[#7B8FA8] underline underline-offset-4 transition-colors hover:text-[#5A6B82]"
          >
            {t("startWithoutSignIn")}
          </button>
        </div>
      )}
    </section>
  );
}
