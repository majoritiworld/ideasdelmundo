/** Generates a random UUID v4 string. */
export const randomID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/** Removes all occurrences of a substring from a string. */
export const deleteSubString = (str: string, subString: string): string =>
  str.replaceAll(subString, "");

/** Alias for randomID — generates a random UUID v4. */
export const getRandomId = () => randomID();

/** Removes special characters (& / \ # , + ( ) $ ~ % . ' " : * ? < > { }) from a string; keeps letters, numbers, and spaces. */
export const removeSpecialChars = (str: string): string => {
  if (!str) return "";

  // Remove all non-alphanumeric characters (except spaces)
  // Then normalize multiple spaces to single spaces and trim
  return str.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "");
};

/** Removes all whitespace (spaces, tabs, newlines) from a string. */
export const removeAllSpaces = (str: string): string => {
  return str.replace(/\s+/g, "");
};

/** Removes every occurrence of a given character from a string. */
export const removeAllOccurrences = (str: string, char: string): string => {
  return str.replace(new RegExp(char, "g"), "");
};

/** Returns true if the string contains the substring (ignores special chars in both). */
export const hasSubString = (str: string, subStr: string): boolean => {
  return removeSpecialChars(str).includes(removeSpecialChars(subStr));
};

/** Derives a short, deterministic alphanumeric code from a string (e.g. for display). */
export const getShortCode = (input: string, length: number = 3): string => {
  // Simple hash function (FNV-1a like)
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  // Convert to base36 and take first 3 chars, uppercase
  return Math.abs(hash).toString(36).toUpperCase().slice(0, length);
};

/** Builds a TikTok profile URL from a username. */
export const buildTiktokUrl = (username: string): string => {
  return `https://www.tiktok.com/@${username}`;
};

/** Builds an Instagram profile URL from a username. */
export const buildInstagramUrl = (username: string): string => {
  return `https://www.instagram.com/${username}`;
};

/** Builds a mailto: URL for opening the default email client. */
export const buildEmailUrl = (email: string): string => {
  return `mailto:${email}`;
};

/** Builds a tel: URL for initiating a phone call. */
export const buildPhoneUrl = (phone: string): string => {
  return `tel:${phone}`;
};

/** Builds a WhatsApp chat URL for a phone number (Israel +972 prefix, dashes stripped). */
export const buildWhatsappUrl = (phone: string): string => {
  return `https://wa.me/+972${removeAllOccurrences(phone, "-")}`;
};

/** Builds a Waze URL for navigation (expects coordinates or address string). */
export const buildWazeUrl = (address: string): string => {
  return `https://www.waze.com/ul?ll=${address}`;
};

/** Truncates a string to maxLength and appends suffix if it was cut. */
export const truncate = (str: string, maxLength: number, suffix = "…"): string => {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength) + suffix;
};

/** Capitalizes the first letter of a string. */
export const capitalize = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/** Converts a string to a URL-safe slug (lowercase, hyphens, no special chars). */
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/** Converts camelCase or PascalCase to Title Case. */
export const camelToTitleCase = (str: string): string => {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
};
