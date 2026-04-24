"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMutation, useBoolean } from "@/hooks";
import { toastSuccess } from "@/lib/toast";
import { Form, TextInput, FormTextarea } from "@/components/form";
import { Button } from "@/components/ui/button";
import Iconify from "@/components/ui/iconify";
import { Typography } from "@/components/ui/typography";
import API_ROUTES from "@/constants/api-routes.constants";
import { contactSchema, type ContactFormValues } from "../validation/contact.schema";
import type { ContactResponse, ContactRequest } from "../types/contact.types";

export function ContactForm() {
  const t = useTranslations("contact");
  const submitted = useBoolean(false);

  const { trigger, isMutating } = useMutation<ContactResponse, ContactRequest>(
    API_ROUTES.CONTACT.SUBMIT
  );

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    try {
      const result = await trigger({ method: "POST", data });
      if (result?.success) {
        submitted.onTrue();
        toastSuccess(t("successTitle"), t("successMessage"));
      }
    } catch {
      // Error toast shown automatically by the API client interceptor
    }
  };

  if (submitted.value) {
    return (
      <div className="bg-card flex flex-col items-center gap-6 rounded-lg border p-8 text-center">
        <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full">
          <Iconify icon="lucide:check-circle" className="text-primary h-7 w-7" />
        </div>
        <div className="space-y-1">
          <Typography variant="subtitle1">{t("successHeading")}</Typography>
          <Typography variant="caption2" color="muted">
            {t("successDescription")}
          </Typography>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            form.reset();
            submitted.onFalse();
          }}
        >
          {t("sendAnother")}
        </Button>
      </div>
    );
  }

  return (
    <Form form={form} onSubmit={onSubmit} className="space-y-4">
      <TextInput name="name" label="labels.name" placeholder="placeholders.name" required />
      <TextInput
        name="email"
        label="labels.email"
        placeholder="placeholders.email"
        type="email"
        required
      />
      <FormTextarea
        name="message"
        label="forms.labels.message"
        placeholder="forms.placeholders.message"
        rows={5}
        showCharCount
        maxLength={1000}
        required
      />
      <Button type="submit" loading={isMutating} className="w-full">
        {t("submit")}
      </Button>
    </Form>
  );
}
