"use client";

import { Controller, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import type { SelectOption } from "@/types/ui.types";
import { Typography } from "@/components/ui/typography";
import { Field, FieldError, FieldLabel } from "@/components/form/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FormSelectProps = {
  name: string;
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  className?: string;
  /** Enable search filtering in the dropdown */
  searchable?: boolean;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
};

export function FormSelect({
  name,
  label,
  placeholder,
  options,
  className,
  searchable = false,
  searchPlaceholder,
}: FormSelectProps) {
  const { control } = useFormContext();
  const tForms = useTranslations("forms");
  const tRoot = useTranslations();
  void searchable;
  void searchPlaceholder;

  const tr = (key: string) => (key.includes(".") ? tForms(key as never) : tRoot(key as never));

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          {label && (
            <FieldLabel htmlFor={`form-select-${name}`}>
              <Typography variant="label2">{tr(label)}</Typography>
            </FieldLabel>
          )}
          <Select
            onValueChange={field.onChange}
            value={typeof field.value === "string" ? field.value : undefined}
          >
            <SelectTrigger
              className="w-full"
              id={`form-select-${name}`}
              aria-invalid={fieldState.invalid}
            >
              <SelectValue placeholder={placeholder ? tr(placeholder) : undefined} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {tr(option.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
