/**
 * Ready-to-use formatters for formatted input fields (currency, percentages, etc.)
 */

export type FormatterFn = {
  /** Format value for display in the input */
  format: (value: string) => string;
  /** Parse display value back to raw value for form state */
  parse: (displayValue: string) => string;
};

/** US Dollar: $1,234.56 */
const dollarFormatter: FormatterFn = {
  format: (value) => {
    const num = value.replace(/[^0-9.]/g, "");
    if (!num) return "";
    const parts = num.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.length > 1 ? `$${parts[0]}.${parts[1].slice(0, 2)}` : `$${parts[0]}`;
  },
  parse: (displayValue) => displayValue.replace(/[^0-9.]/g, "").replace(/,/g, ""),
};

/** Euro: €1.234,56 (European format) */
const euroFormatter: FormatterFn = {
  format: (value) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const [intPart, decPart] = cleaned.split(".");
    const num = intPart ?? "";
    if (!num) return "";
    const formatted = num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const dec = decPart?.slice(0, 2) ?? "";
    return dec ? `€${formatted},${dec}` : `€${formatted}`;
  },
  parse: (displayValue) => {
    const cleaned = displayValue.replace(/[^0-9,]/g, "");
    const [intPart, decPart] = cleaned.split(",");
    const int = (intPart ?? "").replace(/\./g, "");
    const dec = (decPart ?? "").slice(0, 2);
    return dec ? `${int}.${dec}` : int;
  },
};

/** Percentage: 12.5% */
const percentFormatter: FormatterFn = {
  format: (value) => {
    const num = value.replace(/[^0-9.]/g, "");
    if (!num) return "";
    return `${num}%`;
  },
  parse: (displayValue) => displayValue.replace(/[^0-9.]/g, ""),
};

/** Phone (US): (123) 456-7890 */
const phoneFormatter: FormatterFn = {
  format: (value) => {
    const num = value.replace(/\D/g, "").slice(0, 10);
    if (num.length <= 3) return num ? `(${num}` : "";
    if (num.length <= 6) return `(${num.slice(0, 3)}) ${num.slice(3)}`;
    return `(${num.slice(0, 3)}) ${num.slice(3, 6)}-${num.slice(6)}`;
  },
  parse: (displayValue) => displayValue.replace(/\D/g, ""),
};

/** SSN: 123-45-6789 */
const ssnFormatter: FormatterFn = {
  format: (value) => {
    const num = value.replace(/\D/g, "").slice(0, 9);
    if (num.length <= 3) return num;
    if (num.length <= 5) return `${num.slice(0, 3)}-${num.slice(3)}`;
    return `${num.slice(0, 3)}-${num.slice(3, 5)}-${num.slice(5)}`;
  },
  parse: (displayValue) => displayValue.replace(/\D/g, ""),
};

/** Credit card: 1234 5678 9012 3456 */
const creditCardFormatter: FormatterFn = {
  format: (value) => {
    const num = value.replace(/\D/g, "").slice(0, 16);
    return num.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  },
  parse: (displayValue) => displayValue.replace(/\D/g, ""),
};

export const formatBytes: FormatterFn = {
  format: (value) => {
    const decimals = 1;
    const bytes = Number(value);
    if (!Number.isFinite(bytes)) return "0 B";
    if (bytes === 0) return "0 B";

    const absBytes = Math.abs(bytes);
    const units = ["B", "KB", "MB", "GB", "TB"];
    const base = 1024;

    const unitIndex = Math.min(Math.floor(Math.log(absBytes) / Math.log(base)), units.length - 1);

    const output = bytes / Math.pow(base, unitIndex);

    return `${output.toFixed(decimals).replace(/\.0+$/, "")} ${units[unitIndex]}`;
  },
  parse: (displayValue) => displayValue.replace(/\D/g, ""),
};

/** Integer with commas: 1,234 */
const integerFormatter: FormatterFn = {
  format: (value) => {
    const num = value.replace(/[^0-9]/g, "");
    if (!num) return "";
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },
  parse: (displayValue) => displayValue.replace(/[^0-9]/g, ""),
};

export const inputFormatter = {
  dollar: dollarFormatter,
  euro: euroFormatter,
  percent: percentFormatter,
  phone: phoneFormatter,
  ssn: ssnFormatter,
  creditCard: creditCardFormatter,
  bytes: formatBytes,
  integer: integerFormatter,
};
