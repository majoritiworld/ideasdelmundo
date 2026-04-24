import React from "react";
import { cn } from "@/lib/utils";

export type TextColor =
  | "primary"
  | "secondary"
  | "accent"
  | "muted"
  | "destructive"
  | "white"
  | "black"
  | "gray"
  | undefined;

export type TypoVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "subtitle1"
  | "subtitle2"
  | "body1"
  | "body2"
  | "caption1"
  | "caption2"
  | "label1"
  | "label2"
  | "overline";

export type TypographyProps = {
  children: React.ReactNode;
  variant: TypoVariant;
  className?: string;
  color?: TextColor;
  as?: keyof React.JSX.IntrinsicElements;
  style?: React.CSSProperties;
} & Omit<React.HTMLAttributes<HTMLElement>, "color" | "children" | "className" | "style">;

const colorClassMap: Record<Exclude<TextColor, undefined>, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  accent: "text-accent",
  muted: "text-muted-foreground",
  destructive: "text-destructive",
  white: "text-white",
  black: "text-black",
  gray: "text-gray-600",
};

const variantClassMap: Record<
  TypoVariant,
  { tag: keyof React.JSX.IntrinsicElements; classes: string }
> = {
  h1: { tag: "h1", classes: "font-heading text-7xl font-bold text-foreground" },
  h2: { tag: "h2", classes: "font-heading text-5xl font-bold text-foreground" },
  h3: { tag: "h3", classes: "font-heading text-4xl font-bold text-foreground" },
  h4: { tag: "h4", classes: "font-heading text-3xl font-bold text-foreground" },
  h5: { tag: "h5", classes: "font-heading text-2xl font-bold text-foreground" },
  h6: { tag: "h6", classes: "font-heading text-xl font-bold text-foreground" },
  subtitle1: {
    tag: "h2",
    classes: "font-heading text-2xl font-semibold text-foreground",
  },
  subtitle2: {
    tag: "h3",
    classes: "font-heading text-xl font-semibold text-foreground",
  },
  body1: {
    tag: "p",
    classes: "font-sans text-xl text-foreground leading-relaxed",
  },
  body2: {
    tag: "p",
    classes: "font-sans text-lg text-foreground leading-relaxed",
  },
  caption1: {
    tag: "p",
    classes: "font-sans text-base text-muted-foreground leading-relaxed",
  },
  caption2: {
    tag: "p",
    classes: "font-sans text-sm text-muted-foreground leading-relaxed",
  },
  label1: {
    tag: "label",
    classes: "font-sans text-lg text-foreground leading-relaxed",
  },
  label2: {
    tag: "label",
    classes: "font-sans text-base text-foreground leading-relaxed",
  },
  overline: {
    tag: "p",
    classes: "font-heading text-sm font-medium uppercase tracking-wide text-muted-foreground",
  },
};

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(function Typography(
  { children, variant, className, color, as, style, ...rest },
  ref
) {
  const { tag: defaultTag, classes } = variantClassMap[variant];
  const Tag = as || defaultTag;
  const elementClasses = cn(classes, color ? colorClassMap[color] : undefined, className);

  return React.createElement(Tag, { ref, className: elementClasses, style, ...rest }, children);
});

Typography.displayName = "Typography";
