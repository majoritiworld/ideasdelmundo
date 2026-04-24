/**
 * Formats a form validation error message for display.
 * Supports translation keys with params, e.g. "minFilesCount|2" -> t("errors.minFilesCount", { count: 2 })
 */
export function formatFormError(
  t: (key: string, values?: Record<string, string | number>) => string,
  message: string
): string {
  if (message.includes("|")) {
    const [key, ...paramParts] = message.split("|");
    const count = parseInt(paramParts[0] ?? "0", 10);
    return t(`errors.${key}`, { count });
  }
  return t(`errors.${message}`);
}
