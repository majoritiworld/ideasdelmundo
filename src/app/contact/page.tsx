"use client";

import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/app";
import { ContactForm } from "@/features/contact/components/ContactForm";

export default function ContactPage() {
  const t = useTranslations("contact");

  return (
    <PageContainer title={t("pageTitle")} subtitle={t("pageSubtitle")}>
      <div className="max-w-lg">
        <ContactForm />
      </div>
    </PageContainer>
  );
}
