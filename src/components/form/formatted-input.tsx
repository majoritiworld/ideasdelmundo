"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { formatFormError } from "./utils/format-form-error";
import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";
import type { FormatterFn } from "@/utils/formatters";

interface FormattedInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "name" | "value" | "onChange"
> {
  name: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  error?: boolean;
  labelClassName?: string;
  /** Formatter from @/utils/formatters (e.g. dollarFormatter, percentFormatter) */
  formatter: FormatterFn;
}

export const FormattedInput = React.forwardRef<HTMLInputElement, FormattedInputProps>(
  (
    {
      name,
      label,
      helperText,
      required,
      className = "",
      error,
      labelClassName = "",
      formatter,
      placeholder,
      ...props
    },
    ref
  ) => {
    const { control } = useFormContext();
    const t = useTranslations("forms");

    return (
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error: fieldError } }) => {
          const isNumeric = typeof field.value === "number";
          const raw = String(field.value ?? "");
          const displayValue = formatter.format(raw);

          const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawValue = formatter.parse(e.target.value);
            field.onChange(isNumeric ? Number(rawValue) || 0 : rawValue);
          };

          return (
            <div className={cn("w-full", className)}>
              {label && (
                <Label htmlFor={name} className={cn("mb-1", labelClassName)}>
                  <Typography variant="caption1" as="span">
                    {t(label)}
                  </Typography>
                  {required && (
                    <Typography variant="caption2" as="span" color="destructive" className="ms-1">
                      *
                    </Typography>
                  )}
                </Label>
              )}
              <Input
                ref={ref}
                id={name}
                type="text"
                inputMode="decimal"
                aria-invalid={!!(error || fieldError)}
                className={cn(
                  error || fieldError ? "border-destructive focus-visible:ring-destructive" : ""
                )}
                value={displayValue}
                placeholder={placeholder ? t(placeholder) : ""}
                onChange={handleChange}
                onBlur={field.onBlur}
                {...props}
              />
              {(error || fieldError) && (
                <Typography variant="caption2" as="p" color="destructive" className="mt-1">
                  {fieldError?.message ? formatFormError(t, fieldError.message) : helperText}
                </Typography>
              )}
              {!error && !fieldError && helperText && (
                <Typography variant="caption2" as="p" color="muted" className="mt-1">
                  {helperText}
                </Typography>
              )}
            </div>
          );
        }}
      />
    );
  }
);
FormattedInput.displayName = "FormattedInput";
