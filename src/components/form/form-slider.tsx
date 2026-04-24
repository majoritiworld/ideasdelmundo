"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { formatFormError } from "./utils/format-form-error";
import { Typography } from "@/components/ui/typography";

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  helperText?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  className?: string;
  error?: boolean;
  labelClassName?: string;
}

export const FormSlider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      name,
      label,
      helperText,
      min = 0,
      max = 100,
      step = 1,
      required,
      className = "",
      error,
      labelClassName = "",
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
          const sliderValue = field.value ?? min;
          const percentage = ((sliderValue - min) / (max - min)) * 100;
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const [isDragging, setIsDragging] = useState(false);
          return (
            <div className={cn("w-full", className)}>
              {label && (
                <label htmlFor={name} className={cn("mb-1 block", labelClassName)}>
                  <Typography variant="label2" as="span" className="text-sm font-medium">
                    {t(label)}
                  </Typography>
                  {required && (
                    <Typography variant="caption2" as="span" color="destructive" className="ms-1">
                      *
                    </Typography>
                  )}
                </label>
              )}
              <div className="relative w-full pt-6">
                {/* Floating value label */}
                {isDragging && (
                  <div
                    className="bg-foreground pointer-events-none absolute -top-2 z-10 -translate-x-1/2 rounded-md px-3"
                    style={{ left: `${percentage}%` }}
                  >
                    <Typography variant="caption2" color="white">
                      {sliderValue}
                    </Typography>
                    <div className="border-t-foreground absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" />
                  </div>
                )}
                <div className="relative flex touch-none items-center select-none">
                  <div className="bg-muted relative h-2 w-full grow overflow-hidden rounded-full">
                    <div
                      className="bg-foreground absolute h-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    ref={ref}
                    id={name}
                    min={min}
                    max={max}
                    step={step}
                    value={sliderValue}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={() => setIsDragging(false)}
                    className={cn(
                      "[&::-webkit-slider-thumb]:border-foreground [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:ring-offset-background [&::-webkit-slider-thumb]:focus-visible:ring-ring absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:focus-visible:ring-2 [&::-webkit-slider-thumb]:focus-visible:ring-offset-2 [&::-webkit-slider-thumb]:focus-visible:outline-none [&::-webkit-slider-thumb]:disabled:pointer-events-none [&::-webkit-slider-thumb]:disabled:opacity-50",
                      error || fieldError
                        ? "border-destructive focus:ring-destructive focus:border-destructive"
                        : ""
                    )}
                    {...props}
                  />
                </div>
              </div>
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
FormSlider.displayName = "Slider";
