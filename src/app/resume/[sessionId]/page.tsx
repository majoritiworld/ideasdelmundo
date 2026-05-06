"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import API_ROUTES from "@/constants/api-routes.constants";
import WEB_ROUTES from "@/constants/web-routes.constants";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/hooks/use-fetch";
import { setStorage } from "@/hooks/use-local-storage";
import type { SessionRow } from "@/lib/supabase/types";

const RESUME_SESSION_STORAGE_KEY = "resumeSession";

export default function ResumePage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const t = useTranslations("journey.resume");
  const sessionId = params.sessionId;
  const { data, error } = useFetch<{ ok?: boolean; session?: SessionRow }>(
    API_ROUTES.RESUME.BY_SESSION_ID(sessionId)
  );

  useEffect(() => {
    if (data?.session) {
      setStorage(RESUME_SESSION_STORAGE_KEY, data.session);
      router.replace(WEB_ROUTES.HOME);
      return;
    }

  }, [data?.session, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFBFE] px-5 text-center">
        <div className="max-w-md rounded-3xl border border-[#D5DCE6] bg-white/80 px-6 py-8 shadow-[0_18px_55px_rgba(15,27,45,0.08)]">
          <p className="mb-3 font-mono text-[11px] tracking-[0.15em] text-[#7B8FA8] uppercase">
            {t("errorLabel")}
          </p>
          <h1 className="font-heading text-[28px] leading-tight font-medium text-[#0F1B2D]">
            {t("notFoundTitle")}
          </h1>
          <p className="mt-4 text-[15px] leading-7 text-[#5A6B82]">{t("notFoundBody")}</p>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 rounded-full px-6">
            <Link href={WEB_ROUTES.HOME}>{t("startOver")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFBFE]">
      <p className="font-mono text-[13px] tracking-[0.1em] text-[#5A6B82] uppercase">
        {t("loading")}
      </p>
    </div>
  );
}
