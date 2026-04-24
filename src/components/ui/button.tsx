import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";
import Iconify from "@/components/ui/iconify";
import { Spinner } from "@/components/ui/spinner";

type LoadingVariant = "spinner" | "dots" | "ring" | "pulse";

function ButtonLoadingIndicator({ variant }: { variant: LoadingVariant }) {
  if (variant === "dots") {
    return <Iconify icon="svg-spinners:3-dots-fade" className="size-4 shrink-0" aria-hidden />;
  }
  if (variant === "ring") {
    return <Iconify icon="svg-spinners:ring-resize" className="size-4 shrink-0" aria-hidden />;
  }
  if (variant === "pulse") {
    return <Iconify icon="svg-spinners:pulse-3" className="size-4 shrink-0" aria-hidden />;
  }
  return <Spinner className="size-4" />;
}

const buttonVariants = cva(
  "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-full font-sans text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-5 py-2 has-[>svg]:px-4",
        xs: "h-6 gap-1 px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-10 px-7 has-[>svg]:px-5",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        none: "p-0 [&_svg]:p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  loadingVariant = "spinner",
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Shows an inline spinner and disables the button while true */
    loading?: boolean;
    /** Visual style for the loading indicator when `loading` is true */
    loadingVariant?: LoadingVariant;
  }) {
  // Slot (asChild) must receive exactly one element — never a sibling loader + children.
  if (asChild && loading) {
    const child = React.Children.only(children) as React.ReactElement<Record<string, unknown>>;
    const originalOnClick = child.props.onClick as React.MouseEventHandler<HTMLElement> | undefined;
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {React.cloneElement(child, {
          "aria-disabled": true,
          tabIndex: -1,
          onClick: (e: React.MouseEvent<HTMLElement>) => {
            e.preventDefault();
            originalOnClick?.(e);
          },
          children: (
            <>
              <ButtonLoadingIndicator variant={loadingVariant} />
              {child.props.children as React.ReactNode}
            </>
          ),
        })}
      </Slot.Root>
    );
  }

  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading && <ButtonLoadingIndicator variant={loadingVariant} />}
      {children}
    </button>
  );
}

export { Button, buttonVariants };
