export { isEqual, merge, getRandomPastelColor, getIsImageValid } from "./general.utils";
export {
  localStorageAvailable,
  localStorageGetItem,
  localStorageSetItem,
  localStorageRemoveItem,
} from "./local-storage.utils";
export { getMinMaxOfLength, clamp, formatNumber, randomInt } from "./number.utils";
export { formatDate, DateFormatting } from "./date.utils";
export { inputFormatter, formatBytes } from "./formatters";
export type { FormatterFn } from "./formatters";
export {
  randomID,
  getRandomId,
  deleteSubString,
  removeSpecialChars,
  removeAllSpaces,
  removeAllOccurrences,
  hasSubString,
  getShortCode,
  buildTiktokUrl,
  buildInstagramUrl,
  buildEmailUrl,
  buildPhoneUrl,
  buildWhatsappUrl,
  buildWazeUrl,
  truncate,
  capitalize,
  slugify,
  camelToTitleCase,
} from "./string.utils";
export { groupBy, unique, chunk } from "./arr.utils";
export { omit, pick } from "./object.utils";
export { isApiError, parseApiError } from "./error.utils";
