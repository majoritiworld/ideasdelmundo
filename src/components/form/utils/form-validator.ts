import { getMinMaxOfLength } from "@/utils/number.utils";
import { z as zod } from "zod";
import { isValidUrl } from "./form-validator.helpers";

type InputProps = {
  message?: {
    required_error?: string;
    invalid_type_error?: string;
  };
  minFiles?: number;
  isValidPhoneNumber?: (text: string) => boolean;
  required?: boolean;
  canBeZero?: boolean;
};

export const formValidator = {
  requiredPositiveNumber: (data?: { props?: InputProps }) =>
    zod
      .number()
      .nonnegative({ error: "min0" })
      .min(data?.props?.canBeZero ? 0 : 1, {
        error: "required",
      }),

  optionalPositiveNumber: () => zod.number().nonnegative({ error: "min0" }).optional().nullable(),

  requiredMinNumber: (min: number) => zod.number().min(min, { error: "min" }),

  requiredString: (props?: InputProps) =>
    zod.string().min(1, { error: props?.message?.required_error ?? "required" }),

  optionalString: () => zod.string().optional().nullable(),

  requiredPassword: (props?: InputProps) =>
    zod
      .string()
      .min(8, { error: props?.message?.required_error ?? "passwordMin8" })
      .max(64, { error: props?.message?.required_error ?? "passwordMax64" })
      .regex(/[A-Z]/, {
        error: props?.message?.required_error ?? "passwordUppercase",
      })
      .regex(/[a-z]/, {
        error: props?.message?.required_error ?? "passwordLowercase",
      })
      .regex(/[0-9]/, {
        error: props?.message?.required_error ?? "passwordNumber",
      })
      .regex(/[!@#$%^&*]/, {
        error: props?.message?.required_error ?? "passwordSpecial",
      }),

  requiredPasswordRelaxed: (props?: InputProps) =>
    zod.string().min(1, { error: props?.message?.required_error ?? "required" }),
  requiredStringArray: (props?: InputProps) =>
    zod
      .array(zod.string(), {
        error: props?.message?.required_error ?? "required",
      })
      .min(1, { error: props?.message?.required_error ?? "required" }),

  optionalStringArray: () => zod.array(zod.string()),

  /** Exact string length (e.g. OTP digits). */
  requiredExactStringLength: (length: number, props?: InputProps) =>
    zod
      .string()
      .min(length, { error: props?.message?.required_error ?? "minLen" })
      .max(length, { error: props?.message?.required_error ?? "minLen" }),

  /** Inclusive numeric range (e.g. slider 0–100). */
  numberInRange: (min: number, max: number, props?: InputProps) =>
    zod
      .number()
      .min(min, { error: props?.message?.required_error ?? "min" })
      .max(max, { error: props?.message?.required_error ?? "max" }),

  /** Boolean from toggles/switches (not coerced). */
  booleanField: () => zod.boolean(),

  /** Required `Date` from date pickers (single mode). */
  requiredDate: (props?: InputProps) =>
    zod
      .union([zod.undefined(), zod.null(), zod.date()])
      .refine((v) => v instanceof Date && !Number.isNaN((v as Date).getTime()), {
        error: props?.message?.required_error ?? "invalidDate",
      }),

  /** Optional range value from react-day-picker (not validated here). */
  optionalDateRange: () => zod.any().optional(),

  autocompleteSelection: () =>
    zod.array(
      formValidator
        .requiredObject<{
          value: string;
          label: string;
        } | null>()
        .nullable()
    ),

  numberWithLength: (len = 9, props?: InputProps) => {
    const { min, max } = getMinMaxOfLength(len);
    return zod
      .number()
      .gte(min, { error: props?.message?.required_error ?? "minLen" })
      .lte(max, { error: props?.message?.required_error ?? "minLen" });
  },

  stringWithLength: (len = 9, props?: InputProps) => {
    const { min, max } = getMinMaxOfLength(len);
    return zod
      .string()
      .min(min, { error: props?.message?.required_error ?? "minLen" })
      .max(max, { error: props?.message?.required_error ?? "minLen" });
  },

  requiredEmail: () =>
    zod.string().min(1, { error: "emailrequired" }).email({ error: "emailNotValid" }),

  requiredPhoneNumber: (props?: InputProps) =>
    zod
      .string({
        error: (iss) =>
          iss.input === undefined
            ? (props?.message?.required_error ?? "required")
            : (props?.message?.invalid_type_error ?? "invalidPhoneNumber"),
      })
      .min(1, { error: props?.message?.required_error ?? "required" })
      .refine((data) => props?.isValidPhoneNumber?.(data), {
        error: props?.message?.invalid_type_error ?? "invalidPhoneNumber",
      }),

  optionalPhoneNumber: (props?: InputProps) =>
    zod
      .string({
        error: (iss) =>
          iss.input === undefined
            ? (props?.message?.required_error ?? "required")
            : (props?.message?.invalid_type_error ?? "invalidPhoneNumber"),
      })
      .refine((data) => (data.length > 0 ? props?.isValidPhoneNumber?.(data) : true), {
        error: props?.message?.invalid_type_error ?? "invalidPhoneNumber",
      })
      .optional()
      .nullable(),

  requiredStringDate: () =>
    zod.string().refine((val) => !isNaN(Date.parse(val)), {
      error: "invalidDate",
    }),

  richTextContent: (props?: InputProps) =>
    zod.string().min(8, {
      error: props?.message?.required_error ?? "editorRequired",
    }),

  requiredObject: <T>(props?: InputProps) =>
    zod.custom<T | null>().refine((data) => data !== null && data !== "", {
      error: props?.message?.required_error ?? "fieldRequired",
    }),

  requiredBoolean: (props?: InputProps) =>
    zod.boolean().refine((bool) => bool === true, {
      error: props?.message?.required_error ?? "switchRequired",
    }),

  singleFile: (props?: InputProps) =>
    zod.custom<File | string | null>().transform((data, ctx) => {
      const hasFile = data instanceof File || (typeof data === "string" && !!data.length);

      if (props?.required && !hasFile) {
        ctx.addIssue({
          code: "custom",
          message: props?.message?.required_error ?? "fileRequired",
        });
        return null;
      }

      return data;
    }),

  multipleFiles: (props?: InputProps) =>
    zod.array(zod.custom<File | string>()).transform((data, ctx) => {
      const minFiles = props?.minFiles ?? 2;

      if (!data.length) {
        ctx.addIssue({
          code: "custom",
          message: props?.message?.required_error ?? "filesRequired",
        });
      } else if (data.length < minFiles) {
        ctx.addIssue({
          code: "custom",
          message: `minFilesCount|${minFiles}`,
        });
      }

      return data;
    }),

  requiredWebUrl: (props?: InputProps) =>
    zod
      .string({
        error: (iss) =>
          iss.input === undefined
            ? (props?.message?.required_error ?? "required")
            : (props?.message?.invalid_type_error ?? "invalidUrl"),
      })
      .min(1, { error: props?.message?.required_error ?? "required" })
      .refine((url) => isValidUrl(url), {
        error: props?.message?.invalid_type_error ?? "invalidUrl",
      }),

  optionalWebUrl: (props?: InputProps) =>
    zod
      .string({
        error: (iss) =>
          iss.input === undefined
            ? (props?.message?.required_error ?? "required")
            : (props?.message?.invalid_type_error ?? "invalidUrl"),
      })
      .min(1, { error: props?.message?.required_error ?? "required" })
      .refine((url) => isValidUrl(url), {
        error: props?.message?.invalid_type_error ?? "invalidUrl",
      })
      .optional()
      .nullable(),

  /** Named alias for requiredString — signals intent for FormSelect / FormCombobox fields. */
  requiredSelect: (props?: InputProps) =>
    zod.string().min(1, { error: props?.message?.required_error ?? "required" }),

  /** Array-based multi-select with configurable minimum selection count. */
  requiredMultiSelect: (min = 1, props?: InputProps) =>
    zod
      .array(zod.string(), {
        error: props?.message?.required_error ?? "required",
      })
      .min(min, { error: props?.message?.required_error ?? "required" }),

  /** Optional email — valid if provided, empty string / undefined / null is OK. */
  optionalEmail: () =>
    zod.string().email({ error: "emailNotValid" }).or(zod.literal("")).optional().nullable(),

  /**
   * Schema-level password confirmation helper.
   * Usage: schema.refine(...formValidator.confirmPassword("password", "confirmPassword"), { path: ["confirmPassword"] })
   */
  confirmPassword:
    (passwordField: string, confirmField: string) => (data: Record<string, unknown>) =>
      data[passwordField] === data[confirmField],
};
