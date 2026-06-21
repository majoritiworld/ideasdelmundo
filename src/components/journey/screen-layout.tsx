import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Shared horizontal page gutters — 16 / 24 / 32px */
export const journeyGutterX = "px-4 sm:px-6 lg:px-8";

/** Standard vertical page padding for narrative screens — 32 / 48px */
export const journeyGutterY = "py-8 sm:py-12";

/** Compact vertical padding for boards and chat — 24 / 32px */
export const journeyGutterYCompact = "py-6 sm:py-8";

/** Primary content max-width (768px) */
export const journeyMaxContent = "max-w-3xl";

/** Board max-width (896px) */
export const journeyMaxWide = "max-w-4xl";

/** Form / CTA column max-width (448px) */
export const journeyMaxForm = "max-w-md";

/** Major section vertical rhythm */
export const journeySectionGap = "gap-8";

/** Hero block spacing (avatar → title → body) */
export const journeyHeroGap = "gap-6";

/** Button groups and compact stacks */
export const journeyTightGap = "gap-3";

/** Shared elevated card surface */
export const journeyCardClassName =
  "w-full rounded-3xl border border-[#E4E9F1] bg-white/70 p-6 shadow-[0_18px_55px_rgba(15,27,45,0.08)] sm:p-8";

/** Shared primary CTA button sizing */
export const journeyPrimaryButtonClassName =
  "bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-full px-7 transition-all hover:-translate-y-px active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

type JourneyScreenProps<T extends ElementType = "section"> = {
  as?: T;
  variant?: "centered" | "board" | "chat";
  width?: "content" | "wide";
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export function JourneyScreen<T extends ElementType = "section">({
  as,
  variant = "centered",
  width = "content",
  className,
  children,
  ...props
}: JourneyScreenProps<T>) {
  const Component = as ?? "section";

  return (
    <Component
      className={cn(
        "mx-auto flex w-full min-h-dvh flex-col",
        variant === "centered" && [
          journeyMaxContent,
          journeyGutterX,
          journeyGutterY,
          "items-center justify-center text-center",
        ],
        variant === "board" && [
          "relative overflow-hidden",
          journeyGutterX,
          journeyGutterYCompact,
        ],
        variant === "chat" && "relative bg-white",
        width === "wide" && variant === "centered" && journeyMaxWide,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

type JourneyScreenMainProps = {
  className?: string;
  children: ReactNode;
  centered?: boolean;
};

export function JourneyScreenMain({
  className,
  children,
  centered = true,
}: JourneyScreenMainProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col",
        journeySectionGap,
        centered && "m-auto w-full items-center",
        className
      )}
    >
      {children}
    </div>
  );
}

type JourneyHeroProps = {
  className?: string;
  children: ReactNode;
};

export function JourneyHero({ className, children }: JourneyHeroProps) {
  return (
    <div className={cn("flex w-full flex-col items-center text-center", journeyHeroGap, className)}>
      {children}
    </div>
  );
}

type JourneyCardProps = {
  className?: string;
  children: ReactNode;
  size?: "default" | "question";
};

export function JourneyCard({ className, children, size = "default" }: JourneyCardProps) {
  return (
    <div
      className={cn(
        journeyCardClassName,
        size === "question" && "min-h-[11.75rem] max-w-[37rem]",
        className
      )}
    >
      {children}
    </div>
  );
}

type JourneyActionsProps = {
  className?: string;
  children: ReactNode;
  align?: "center" | "stretch";
};

export function JourneyActions({ className, children, align = "center" }: JourneyActionsProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col sm:flex-row",
        journeyTightGap,
        align === "center" && "sm:justify-center",
        align === "stretch" && journeyMaxForm,
        className
      )}
    >
      {children}
    </div>
  );
}

type JourneyBoardCanvasProps = {
  className?: string;
  children: ReactNode;
  centered?: boolean;
};

export function JourneyBoardCanvas({
  className,
  children,
  centered = false,
}: JourneyBoardCanvasProps) {
  return (
    <div
      className={cn(
        "relative z-10 mx-auto flex min-h-[calc(100dvh-3rem)] w-full flex-col items-center",
        journeyMaxWide,
        journeySectionGap,
        centered && "justify-center",
        className
      )}
    >
      {children}
    </div>
  );
}

export function JourneyBoardBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(27,61,212,0.08),transparent_36%)]" />
  );
}

type JourneyChatColumnProps = {
  className?: string;
  children: ReactNode;
};

export function JourneyChatColumn({ className, children }: JourneyChatColumnProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col",
        journeyMaxContent,
        journeyGutterX,
        className
      )}
    >
      {children}
    </div>
  );
}

type JourneyStickyFooterProps = {
  className?: string;
  children: ReactNode;
};

export function JourneyStickyFooter({ className, children }: JourneyStickyFooterProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 flex w-full justify-center bg-[#FAFBFE]/80 py-4 backdrop-blur",
        className
      )}
    >
      {children}
    </div>
  );
}
