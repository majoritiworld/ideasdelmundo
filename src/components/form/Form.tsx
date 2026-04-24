"use client";

import * as React from "react";
import {
  FormProvider,
  useFormContext,
  type UseFormReturn,
  type FieldValues,
} from "react-hook-form";

interface FormProps<T extends FieldValues> extends Omit<React.ComponentProps<"form">, "onSubmit"> {
  form: UseFormReturn<T>;
  onSubmit: (data: T) => void | Promise<void>;
  children: React.ReactNode;
}

export function Form<T extends FieldValues>({ form, onSubmit, children, ...props }: FormProps<T>) {
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} {...props}>
        {children}
      </form>
    </FormProvider>
  );
}

export function useFormField() {
  const context = useFormContext();
  return context;
}
