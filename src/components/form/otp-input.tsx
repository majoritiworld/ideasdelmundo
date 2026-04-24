"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { formatFormError } from "./utils/format-form-error";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";

interface OTPInputProps {
  name: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  length?: number;
  className?: string;
  error?: boolean;
  labelClassName?: string;
}

export const FormOTPInput = React.forwardRef<HTMLDivElement, OTPInputProps>(
  (
    { name, label, helperText, required, length = 6, className = "", error, labelClassName = "" },
    ref
  ) => {
    const { control } = useFormContext();
    const t = useTranslations("forms");

    return (
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error: fieldError } }) => (
          <div className={cn("w-full", className)} ref={ref}>
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
            <InputOTP
              maxLength={length}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              aria-invalid={!!(error || fieldError)}
            >
              <InputOTPGroup
                className={cn(
                  "gap-1",
                  error || fieldError ? "border-destructive ring-destructive/20" : ""
                )}
              >
                {Array.from({ length }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
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
        )}
      />
    );
  }
);
FormOTPInput.displayName = "FormOTPInput";
