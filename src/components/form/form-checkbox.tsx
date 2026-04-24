"use client";

import { Controller, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError } from "@/components/form/field";
import { cn } from "@/lib/utils";

export type FormCheckboxProps = {
  name: string;
  label?: string;
  description?: string;
  className?: string;
};

export function FormCheckbox({ name, label, description, className }: FormCheckboxProps) {
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
          <Checkbox
            id={`form-checkbox-${name}`}
            checked={!!field.value}
            onCheckedChange={field.onChange}
            onBlur={field.onBlur}
            aria-invalid={fieldState.invalid}
            className="mt-0.5"
          />
          <div className="flex flex-1 flex-col gap-1">
            {label && (
              <label
                htmlFor={`form-checkbox-${name}`}
                className="cursor-pointer text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
              >
                {tForms(label as never)}
              </label>
            )}
            {description && !fieldState.invalid && (
              <FieldDescription>{tForms(description as never)}</FieldDescription>
            )}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </div>
        </Field>
      )}
    />
  );
}
