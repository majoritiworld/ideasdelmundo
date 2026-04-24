import { Icon, type IconProps } from "@iconify/react";
import { cn } from "@/lib/utils";

export type IconifyColor =
  | "foreground"
  | "error"
  | "warning"
  | "primary"
  | "secondary"
  | "white"
  | "black";

export type IconifyProps = {
  icon: string;
  className?: string;
  /**
   * When omitted, the icon uses `text-inherit` so it follows the parent `color`
   * (e.g. `text-primary-foreground` on a solid primary `Button`).
   * Use `foreground` for theme body text on neutral surfaces.
   */
  color?: IconifyColor;
} & Omit<IconProps, "icon">;

const colorClasses: Record<IconifyColor, string> = {
  foreground: "text-foreground",
  error: "text-red-500",
  warning: "text-orange-500",
  primary: "text-primary",
  secondary: "text-secondary",
  white: "text-white",
  black: "text-black",
};

export default function Iconify({ icon, className, color, ...props }: IconifyProps) {
  return (
    <Icon
      {...props}
      icon={icon}
      className={cn(color ? colorClasses[color] : "text-inherit", className)}
    />
  );
}
