"use client";

import { Controller, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { Field, FieldDescription, FieldError } from "@/components/form/field";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export type FormSwitchProps = {
  name: string;
  label?: string;
  description?: string;
  className?: string;
  size?: "sm" | "default";
  color?: "default" | "success" | "destructive";
};

export function FormSwitch({
  name,
  label,
  description,
  className,
  size = "default",
  color = "default",
}: FormSwitchProps) {
  const { control } = useFormContext();
  const tForms = useTranslations("forms");

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field
          orientation="horizontal"
          data-invalid={fieldState.invalid}
          className={cn("items-start", className)}
        >
          <div className="flex flex-1 flex-col gap-1">
            {label && (
              <Typography
                variant="label2"
                as="span"
                className="text-sm leading-none font-medium select-none"
              >
                {tForms(label as never)}
              </Typography>
            )}
            {description && !fieldState.invalid && (
              <FieldDescription>{tForms(description as never)}</FieldDescription>
            )}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </div>
          <Switch
            id={`form-switch-${name}`}
            checked={!!field.value}
            onCheckedChange={field.onChange}
            onBlur={field.onBlur}
            size={size}
            color={color}
          />
        </Field>
      )}
    />
  );
}
