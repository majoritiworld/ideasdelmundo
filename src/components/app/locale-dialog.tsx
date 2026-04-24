"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import Iconify from "@/components/ui/iconify";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  SUPPORTED_LOCALES,
  isAppLocale,
  type AppLocale,
} from "@/constants/locale";
import Cookies from "js-cookie";

const LOCALE_ICON: Record<AppLocale, string> = {
  en: "ri:english-input",
  he: "tabler:alphabet-hebrew",
  ar: "tabler:alphabet-arabic",
  es: "tabler:language",
};

/**
 * Globe trigger opens a compact popover to pick the app locale.
 * Sets `NEXT_LOCALE` and reloads so the server picks up the new locale.
 */
export function LocaleDialog() {
  const t = useTranslations();
  const rawLocale = useLocale();
  const locale: AppLocale = isAppLocale(rawLocale) ? rawLocale : "en";
  const [open, setOpen] = React.useState(false);

  const select = (code: AppLocale) => {
    if (code === locale) {
      setOpen(false);
      return;
    }
    Cookies.set(LOCALE_COOKIE, code, {
      path: "/",
      expires: LOCALE_COOKIE_MAX_AGE / (60 * 60 * 24),
      sameSite: "lax",
    });
    window.location.reload();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("languageDialogTriggerAria")}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Iconify icon="lucide:languages" className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-2" sideOffset={6}>
        <PopoverHeader className="px-2 pt-0.5 pb-2">
          <PopoverTitle>{t("languageDialogTitle")}</PopoverTitle>
        </PopoverHeader>
        <ul className="flex flex-col gap-0.5" role="menu">
          {SUPPORTED_LOCALES.map((code) => {
            const active = code === locale;
            return (
              <li key={code} role="none">
                <Button
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  variant="ghost"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-start text-sm transition-colors outline-none",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:bg-accent focus-visible:text-accent-foreground",
                    active && "bg-accent/80 text-accent-foreground"
                  )}
                  onClick={() => select(code)}
                >
                  <Iconify icon={LOCALE_ICON[code]} className="size-6 shrink-0" aria-hidden />
                  <Typography variant="label2" as="span" className="font-medium">
                    {t(`languages.${code}`)}
                  </Typography>
                </Button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
