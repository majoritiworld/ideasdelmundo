"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Field, FieldLabel, FieldError } from "@/components/form/field";
import { Typography } from "@/components/ui/typography";
import Iconify from "@/components/ui/iconify";
import { cn } from "@/lib/utils";
import type { SelectOption } from "@/types/ui.types";

export type FormComboboxProps = {
  name: string;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  options: SelectOption[];
  className?: string;
};

export function FormCombobox({
  name,
  label,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  options,
  className,
}: FormComboboxProps) {
  const { control } = useFormContext();
  const tForms = useTranslations("forms");
  const tRoot = useTranslations();
  const [open, setOpen] = React.useState(false);

  const tr = (key: string) => (key.includes(".") ? tForms(key as never) : tRoot(key as never));

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selected = options.find((o) => o.value === field.value);

        return (
          <Field data-invalid={fieldState.invalid} className={className}>
            {label && (
              <FieldLabel htmlFor={`form-combobox-${name}`}>
                <Typography variant="label2">{tr(label)}</Typography>
              </FieldLabel>
            )}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  id={`form-combobox-${name}`}
                  type="button"
                  role="combobox"
                  aria-expanded={open}
                  aria-invalid={fieldState.invalid}
                  className={cn(
                    "border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-start font-sans text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
                    !selected && "text-muted-foreground",
                    fieldState.invalid && "border-destructive ring-destructive/20"
                  )}
                >
                  <Typography variant="caption1" as="span" className="truncate text-sm">
                    {selected
                      ? tr(selected.label)
                      : placeholder
                        ? tr(placeholder)
                        : tRoot("select")}
                  </Typography>
                  <Iconify
                    icon="lucide:chevrons-up-down"
                    className="ms-2 size-4 shrink-0 opacity-50"
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder={searchPlaceholder ? tr(searchPlaceholder) : tRoot("search")}
                  />
                  <CommandList>
                    <CommandEmpty>{emptyLabel ? tr(emptyLabel) : tRoot("noResults")}</CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={(val) => {
                            field.onChange(val === field.value ? "" : val);
                            setOpen(false);
                          }}
                        >
                          <Iconify
                            icon="lucide:check"
                            className={cn(
                              "size-4",
                              field.value === option.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {tr(option.label)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}
