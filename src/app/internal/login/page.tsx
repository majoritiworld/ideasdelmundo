"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WEB_ROUTES from "@/constants/web-routes.constants";
import { createClient } from "@/utils/supabase/client";

export default function InternalLoginPage() {
  const t = useTranslations("admin.login");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function signInWithGoogle() {
    setStatus("loading");
    setMessage(t("redirecting"));

    const supabase = createClient();
    const callbackUrl = new URL(WEB_ROUTES.INTERNAL.AUTH_CALLBACK, window.location.origin);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFBFE] px-5 py-10">
      <Card className="w-full max-w-md border-[#D5DCE6] bg-white">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            loading={status === "loading"}
            onClick={signInWithGoogle}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full rounded-full"
          >
            {t("googleSubmit")}
          </Button>
          {message && (
            <p className={`mt-4 text-sm ${status === "error" ? "text-red-600" : "text-[#5A6B82]"}`}>
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
