/** Cookie used by `src/i18n/request.ts` to resolve messages and server-side `lang`. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const SUPPORTED_LOCALES = ["en", "es", "he", "ar"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

type LocaleDirection = "ltr" | "rtl";
type RtlLocale = Extract<AppLocale, "he" | "ar">;

const RTL_LOCALES: ReadonlySet<RtlLocale> = new Set(["he", "ar"]);

export function isAppLocale(value: string): value is AppLocale {
  return SUPPORTED_LOCALES.includes(value as AppLocale);
}

export function isRTL(locale: AppLocale): boolean {
  return RTL_LOCALES.has(locale as RtlLocale);
}

export function getLocaleDirection(locale: AppLocale): LocaleDirection {
  return isRTL(locale) ? "rtl" : "ltr";
}

/** 1 year, in seconds. Persists language preference across visits. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
