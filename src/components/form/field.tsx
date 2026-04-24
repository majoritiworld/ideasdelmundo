"use client";

import * as React from "react";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const Field = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    orientation?: "vertical" | "horizontal";
  }
>(({ className, orientation = "vertical", ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="field"
      data-orientation={orientation}
      className={cn(
        // gap-1.5 for consistent label-to-field spacing across all form fields
        "group/field flex flex-col gap-1.5 data-[orientation=horizontal]:flex-row data-[orientation=horizontal]:items-center data-[orientation=horizontal]:justify-between data-[orientation=horizontal]:gap-4",
        className
      )}
      {...props}
    />
  );
});
Field.displayName = "Field";

const FieldGroup = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="field-group"
        className={cn("flex flex-col gap-4", className)}
        {...props}
      />
    );
  }
);
FieldGroup.displayName = "FieldGroup";

const FieldLabel = React.forwardRef<HTMLLabelElement, React.ComponentPropsWithoutRef<"label">>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        data-slot="field-label"
        className={cn(
          "group-data-[invalid=true]/field:text-destructive text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
FieldLabel.displayName = "FieldLabel";

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<"p">
>(({ className, children, color: _htmlColor, ...rest }, ref) => {
  void _htmlColor;
  return (
    <Typography
      ref={ref}
      variant="caption2"
      as="p"
      color="muted"
      data-slot="field-description"
      className={className}
      {...rest}
    >
      {children}
    </Typography>
  );
});
FieldDescription.displayName = "FieldDescription";

const FieldError = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    errors?: Array<{ message?: string } | undefined>;
  }
>(({ className, errors, ...props }, ref) => {
  const t = useTranslations();
  if (!errors?.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      data-slot="field-error"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    >
      {errors.map((error, index) => (
        <Typography
          key={index}
          variant="caption2"
          as="p"
          color="destructive"
          className="leading-none font-medium"
        >
          {t(error?.message || "form_validation.required")}
        </Typography>
      ))}
    </div>
  );
});
FieldError.displayName = "FieldError";

const FieldContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="field-content"
        className={cn("flex flex-1 flex-col gap-1.5", className)}
        {...props}
      />
    );
  }
);
FieldContent.displayName = "FieldContent";

const FieldSet = React.forwardRef<HTMLFieldSetElement, React.ComponentPropsWithoutRef<"fieldset">>(
  ({ className, ...props }, ref) => {
    return (
      <fieldset
        ref={ref}
        data-slot="fieldset"
        className={cn("flex flex-col gap-2", className)}
        {...props}
      />
    );
  }
);
FieldSet.displayName = "FieldSet";

const FieldLegend = React.forwardRef<
  HTMLLegendElement,
  React.ComponentPropsWithoutRef<"legend"> & {
    variant?: "default" | "label";
  }
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <legend
      ref={ref}
      data-slot="field-legend"
      data-variant={variant}
      className={cn("text-sm leading-none font-medium data-[variant=label]:text-base", className)}
      {...props}
    />
  );
});
FieldLegend.displayName = "FieldLegend";

export {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldContent,
  FieldSet,
  FieldLegend,
};
