export function getMinMaxOfLength(x: number): { min: number; max: number } {
  if (x <= 0) {
    throw new Error("Length must be a positive integer.");
  }

  const min = x === 1 ? 0 : 10 ** (x - 1);
  const max = 10 ** x - 1;

  return { min, max };
}

/** Clamps a number between min and max (inclusive). */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/** Locale-aware number formatting. */
export const formatNumber = (
  value: number,
  locale?: string,
  options?: Intl.NumberFormatOptions
): string => new Intl.NumberFormat(locale, options).format(value);

/** Returns a random integer between min and max (inclusive). */
export const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;
