"use client";

import { useTranslations } from "next-intl";
import { useThemeStore } from "@/store/theme.store";
import { Button } from "@/components/ui/button";
import Iconify from "@/components/ui/iconify";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ----------------------------------------------------------------------

type ThemeToggleProps = {
  className?: string;
};

/**
 * Icon button that toggles between light and dark mode.
 * Reads/writes the theme via useThemeStore.
 *
 * @example
 * <ThemeToggle />
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const t = useTranslations();
  const { theme, toggle } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={isDark ? t("themeSwitchToLightAria") : t("themeSwitchToDarkAria")}
          className={className}
        >
          <Iconify icon={isDark ? "lucide:sun" : "lucide:moon"} className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isDark ? t("themeLightMode") : t("themeDarkMode")}</TooltipContent>
    </Tooltip>
  );
}
