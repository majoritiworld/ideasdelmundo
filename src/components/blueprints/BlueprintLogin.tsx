"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WEB_ROUTES from "@/constants/web-routes.constants";
import { createClient } from "@/utils/supabase/client";

export function BlueprintLogin({ slug }: { slug: string }) {
  const t = useTranslations("blueprint.access");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const origin = window.location.origin;
    const callbackUrl = new URL(WEB_ROUTES.BLUEPRINT.AUTH_CALLBACK, origin);
    callbackUrl.searchParams.set("next", WEB_ROUTES.BLUEPRINT.BY_SLUG(slug));

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage(t("sent"));
  }

  return (
    <form onSubmit={submitLogin} className="mt-8 grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-[#0F1B2D]">
        {t("emailLabel")}
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("emailPlaceholder")}
          required
          className="h-12 rounded-full border-[#D5DCE6] bg-white px-5"
        />
      </label>
      <Button type="submit" loading={status === "loading"} className="h-12">
        {t("submit")}
      </Button>
      {message ? (
        <p className={`text-sm ${status === "error" ? "text-red-600" : "text-[#5A6B82]"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
