"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/form/field";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export type FormTextareaProps = {
  name: string;
  label?: string;
  placeholder?: string;
  description?: string;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
  className?: string;
  required?: boolean;
};

export function FormTextarea({
  name,
  label,
  placeholder,
  description,
  rows = 3,
  maxLength,
  showCharCount = false,
  className,
  required,
}: FormTextareaProps) {
  const { control } = useFormContext();
  const t = useTranslations();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const charCount = String(field.value ?? "").length;

        return (
          <Field data-invalid={fieldState.invalid} className={className}>
            {label && (
              <FieldLabel htmlFor={`form-textarea-${name}`}>
                <Typography variant="label2">
                  {t(label)}
                  {required && (
                    <Typography variant="caption2" as="span" color="destructive" className="ms-1">
                      *
                    </Typography>
                  )}
                </Typography>
              </FieldLabel>
            )}
            <div className="relative">
              <Textarea
                id={`form-textarea-${name}`}
                rows={rows}
                maxLength={maxLength}
                placeholder={placeholder ? t(placeholder) : undefined}
                aria-invalid={fieldState.invalid}
                {...field}
                value={field.value ?? ""}
              />
              {showCharCount && maxLength && (
                <Typography
                  variant="caption2"
                  as="span"
                  className={cn(
                    "absolute end-2 bottom-2 text-xs",
                    charCount >= maxLength ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {charCount}/{maxLength}
                </Typography>
              )}
            </div>
            {description && !fieldState.invalid && (
              <FieldDescription>{t(description)}</FieldDescription>
            )}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}
