import { format } from "date-fns";
import { he, Locale, enUS } from "date-fns/locale";

export enum DateFormatting {
  /** e.g., 2025-03-27 */
  ISO_DATE = "yyyy-MM-dd",

  /** e.g., 2025-03-27T15:30:00 */
  ISO_DATE_TIME = "yyyy-MM-dd'T'HH:mm:ss",

  /** e.g., 27/03/2025 */
  SLASH_DATE = "dd/MM/yyyy",

  /** e.g., 03/27/2025 */
  US_SLASH_DATE = "MM/dd/yyyy",

  /** e.g., March 27, 2025 */
  FULL_DATE = "MMMM d, yyyy",

  /** e.g., Thu, Mar 27 */
  SHORT_DAY_DATE = "EEE, MMM d",

  /** e.g., Thursday, March 27, 2025 */
  LONG_DAY_DATE = "EEEE, MMMM d, yyyy",

  /** e.g., 03:45 PM */
  TIME_12_HOUR = "hh:mm a",

  /** e.g., 15:45 */
  TIME_24_HOUR = "HH:mm",

  /** e.g., Mar 27, 2025 15:45 */
  DATE_TIME_SHORT = "MMM d, yyyy HH:mm",

  /** e.g., Thursday, 27/03/2025, 15:45 */
  DATE_TIME_MEDIUM = "EEEE, dd/MM/yyyy, HH:mm",

  /** e.g., Today at 3:45 PM (for logic-driven formatting) */
  HUMANIZED = "eeee 'at' h:mm a",

  /** e.g., Thursday */
  DAY_NAME = "EEEE",
}

function getLocale(currentLang: string): Locale {
  if (currentLang === "he") {
    return he;
  }
  return enUS;
}

export function formatDate(
  date: Date,
  formatString: DateFormatting,
  currentLang: string = "he"
): string {
  return format(date, formatString, { locale: getLocale(currentLang) });
}
