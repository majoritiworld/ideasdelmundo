"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { formatFormError } from "./utils/format-form-error";
import { format } from "date-fns";
import Iconify from "@/components/ui/iconify";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Typography } from "@/components/ui/typography";
import type { DateRange } from "react-day-picker";

interface DateInputProps {
  name: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  error?: boolean;
  labelClassName?: string;
  /** "single" for one date, "range" for date range */
  mode?: "single" | "range";
  placeholder?: string;
  placeholderText?: string;
  displayFormat?: string;
  disabled?: boolean;
}

export const DateInput = React.forwardRef<HTMLButtonElement, DateInputProps>(
  (
    {
      name,
      label,
      helperText,
      required,
      className = "",
      error,
      labelClassName = "",
      mode = "single",
      placeholder,
      placeholderText,
      displayFormat = "PPP",
      disabled,
    },
    ref
  ) => {
    const { control } = useFormContext();
    const t = useTranslations("forms");
    const [open, setOpen] = React.useState(false);

    const resolvedPlaceholderText =
      placeholderText ??
      placeholder ??
      (mode === "range"
        ? `${t("labels.startDate")} - ${t("labels.endDate")}`
        : t("placeholders.date"));

    return (
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error: fieldError } }) => {
          const value = field.value as Date | DateRange | undefined;
          const displayValue =
            mode === "single" && value && !Array.isArray(value)
              ? format(value as Date, displayFormat)
              : mode === "range" && value && typeof value === "object" && "from" in value
                ? value.from
                  ? value.to
                    ? `${format(value.from, displayFormat)} - ${format(value.to, displayFormat)}`
                    : format(value.from, displayFormat)
                  : resolvedPlaceholderText
                : resolvedPlaceholderText;

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
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    ref={ref}
                    id={name}
                    variant="outline"
                    disabled={disabled}
                    aria-invalid={!!(error || fieldError)}
                    className={cn(
                      "w-full justify-start text-start font-normal",
                      !value && "text-muted-foreground",
                      error || fieldError ? "border-destructive focus-visible:ring-destructive" : ""
                    )}
                  >
                    <Iconify icon="lucide:calendar" className="me-2 size-4" />
                    <Typography variant="caption1" as="span" className="font-normal text-inherit">
                      {displayValue}
                    </Typography>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  {mode === "single" ? (
                    <Calendar
                      mode="single"
                      selected={value as Date | undefined}
                      onSelect={(date) => {
                        field.onChange(date);
                        setOpen(false);
                      }}
                      initialFocus
                    />
                  ) : (
                    <Calendar
                      mode="range"
                      selected={value as DateRange | undefined}
                      required={false}
                      onSelect={(date) => {
                        field.onChange(date);
                      }}
                      initialFocus
                    />
                  )}
                </PopoverContent>
              </Popover>
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
DateInput.displayName = "DateInput";
