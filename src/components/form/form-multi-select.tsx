"use client";

import { Controller, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Typography } from "@/components/ui/typography";
import { MultiSelect } from "@/components/ui/multi-select";
import type { MultiSelectOption } from "@/types/ui.types";
import { Field, FieldError, FieldLabel } from "@/components/form/field";

export type FormMultiSelectProps = {
  name: string;
  label?: string;
  placeholder?: string;
  options: MultiSelectOption[];
  className?: string;
  maxDisplay?: number;
  maxSelected?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  onlyDeselectAll?: boolean;
  allSelectedLabel?: string;
};

export function FormMultiSelect({
  name,
  label,
  placeholder,
  options,
  className,
  maxDisplay = 2,
  maxSelected,
  searchable = false,
  searchPlaceholder,
  onlyDeselectAll = false,
  allSelectedLabel = "all",
}: FormMultiSelectProps) {
  const { control } = useFormContext();
  const tForms = useTranslations("forms");
  const tRoot = useTranslations();

  const tr = (key: string) => (key.includes(".") ? tForms(key as never) : tRoot(key as never));

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          {label && (
            <FieldLabel htmlFor={`form-multi-select-${name}`}>
              <Typography variant="label2">{tr(label)}</Typography>
            </FieldLabel>
          )}
          <MultiSelect
            options={options}
            selected={Array.isArray(field.value) ? field.value : []}
            onChange={field.onChange}
            placeholder={placeholder ? tr(placeholder) : undefined}
            maxDisplay={maxDisplay}
            maxSelected={maxSelected}
            className="w-full"
            searchable={searchable}
            searchPlaceholder={searchPlaceholder ? tr(searchPlaceholder) : undefined}
            onlyDeselectAll={onlyDeselectAll}
            allSelectedLabel={allSelectedLabel}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
