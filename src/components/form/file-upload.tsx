"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { formatFormError } from "./utils/format-form-error";
import Iconify from "@/components/ui/iconify";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PdfPreview } from "@/components/ui/pdf-preview";
import { Typography } from "@/components/ui/typography";
import { inputFormatter } from "@/utils/formatters";

interface FileUploadProps {
  name: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  error?: boolean;
  labelClassName?: string;
  /** Max file size in bytes */
  maxSize?: number;
  /** Accepted MIME types, e.g. ["image/*", "application/pdf"] */
  accept?: string | string[];
  /** Allow multiple files */
  multiple?: boolean;
  disabled?: boolean;
  /**
   * When true (default): compact list view with upload button.
   * When false: expanded view with drag & drop zone and preview cards.
   */
  compact?: boolean;
}

export const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      name,
      label,
      helperText,
      required,
      className = "",
      error,
      labelClassName = "",
      maxSize,
      accept,
      multiple = false,
      disabled,
      compact = true,
    },
    ref
  ) => {
    const { control } = useFormContext();
    const t = useTranslations("forms");
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragError, setDragError] = React.useState<string | null>(null);

    const acceptStr = Array.isArray(accept) ? accept.join(",") : accept;

    const validateDroppedFiles = React.useCallback(
      (items: DataTransferItemList): boolean => {
        const types = acceptStr?.split(",").filter(Boolean) ?? [];
        if (types.length === 0) return true;
        return Array.from(items).some((item) =>
          types.some((type) => {
            if (type.endsWith("/*")) {
              const base = type.replace("/*", "");
              return item.type.startsWith(base);
            }
            return item.type === type;
          })
        );
      },
      [acceptStr]
    );

    return (
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error: fieldError } }) => {
          const files = field.value as File[] | File | undefined;
          const fileList = Array.isArray(files) ? files : files ? [files] : [];

          const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const selected = e.target.files;
            if (!selected?.length) return;
            addFiles(selected);
            e.target.value = "";
          };

          const isDuplicate = (file: File, existing: File[]) =>
            existing.some(
              (f) =>
                f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
            );

          const addFiles = (newFiles: FileList | File[]) => {
            const arr = Array.from(newFiles);
            const valid = maxSize ? arr.filter((f) => f.size <= maxSize) : arr;
            const newUnique = valid.filter((f) => !isDuplicate(f, fileList));
            field.onChange(multiple ? [...fileList, ...newUnique] : (newUnique[0] ?? fileList[0]));
          };

          const removeFile = (index: number) => {
            const next = fileList.filter((_, i) => i !== index);
            field.onChange(multiple ? next : next[0]);
          };

          const clearAll = () => {
            field.onChange(multiple ? [] : undefined);
            if (inputRef.current) inputRef.current.value = "";
          };

          const handleDrop = (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            setDragError(null);
            const dropped = e.dataTransfer.files;
            if (dropped.length) addFiles(dropped);
          };

          const handleDragOver = (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
            const valid = validateDroppedFiles(e.dataTransfer.items);
            setDragError(valid ? null : t("errors.fileTypeNotAllowed"));
          };

          const handleDragLeave = (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            setDragError(null);
          };

          const renderInput = () => (
            <input
              ref={(el) => {
                (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                if (typeof ref === "function") ref(el);
                else if (ref) ref.current = el;
              }}
              id={name}
              type="file"
              accept={acceptStr}
              multiple={multiple}
              disabled={disabled}
              onChange={handleChange}
              className="hidden"
              aria-invalid={!!(error || fieldError)}
            />
          );

          if (compact) {
            return (
              <div className={cn("w-full", className)}>
                {label && (
                  <Label htmlFor={name} className={cn("mb-1", labelClassName)}>
                    <Typography variant="caption1">{t(label)}</Typography>
                    {required && (
                      <Typography variant="caption2" as="span" color="destructive" className="ms-1">
                        *
                      </Typography>
                    )}
                  </Label>
                )}
                <div
                  className={cn(
                    "flex flex-col gap-2 rounded-md border border-dashed p-4 transition-colors",
                    "hover:bg-muted/50",
                    error || fieldError ? "border-destructive" : "border-input"
                  )}
                >
                  {renderInput()}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => inputRef.current?.click()}
                    className="w-fit"
                  >
                    <Iconify icon="lucide:upload" className="mr-2 size-4" />
                    {t("placeholders.upload")}
                  </Button>
                  {fileList.length > 0 && (
                    <ul className="space-y-1">
                      {fileList.map((file, i) => (
                        <li
                          key={i}
                          className="bg-muted flex items-center justify-between rounded px-2 py-1 text-sm"
                        >
                          <Typography variant="caption1" as="span" className="truncate">
                            {file.name}
                          </Typography>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            onClick={() => removeFile(i)}
                            aria-label="Remove file"
                          >
                            <Iconify icon="lucide:x" className="size-3" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {fileList.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      className="text-muted-foreground w-fit"
                    >
                      {t("helpers.clearFiles")}
                    </Button>
                  )}
                </div>
                {(error || fieldError) && (
                  <Typography variant="caption1" color="destructive" className="mt-1">
                    {fieldError?.message ? formatFormError(t, fieldError.message) : helperText}
                  </Typography>
                )}
                {!error && !fieldError && helperText && (
                  <Typography variant="caption1" color="muted" className="mt-1">
                    {helperText}
                  </Typography>
                )}
                {!error && !fieldError && maxSize && (
                  <Typography variant="caption2" color="muted" className="mt-1">
                    {t("helpers.maxSize", {
                      size: inputFormatter.bytes.format(maxSize.toString()),
                    })}
                  </Typography>
                )}
              </div>
            );
          }

          // Expanded view: drag & drop zone + preview cards
          return (
            <div className={cn("w-full", className)}>
              {label && (
                <Label htmlFor={name} className={cn("mb-1", labelClassName)}>
                  <Typography variant="caption1" as="span">
                    {t(label)}
                  </Typography>
                  {required && (
                    <Typography variant="caption2" as="span" color="destructive" className="ms-1">
                      *
                    </Typography>
                  )}
                </Label>
              )}
              {renderInput()}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "group relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200",
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800/30",
                  error || fieldError ? "border-destructive" : "",
                  dragError && "border-destructive bg-destructive/5"
                )}
              >
                <div className="flex flex-col items-center justify-center gap-4 px-8 py-16">
                  <div
                    className={cn(
                      "flex size-16 items-center justify-center rounded-2xl transition-colors",
                      isDragging
                        ? "bg-primary/20 text-primary"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700 dark:group-hover:text-slate-300"
                    )}
                  >
                    <Iconify icon="lucide:file-up" className="size-8" />
                  </div>
                  <div className="text-center">
                    <Typography variant="label2" className="font-medium">
                      {isDragging ? t("placeholders.dropHere") : t("placeholders.dragDrop")}
                    </Typography>
                    <Typography variant="caption1" color="muted" className="mt-1">
                      {t("placeholders.browseHint")}
                      {maxSize && (
                        <>
                          {" "}
                          ·{" "}
                          {t("helpers.maxSize", {
                            size: inputFormatter.bytes.format(maxSize.toString()),
                          })}
                        </>
                      )}
                    </Typography>
                    {dragError && (
                      <Typography variant="caption1" color="destructive" className="mt-2">
                        {dragError}
                      </Typography>
                    )}
                  </div>
                </div>
              </div>

              {fileList.length > 0 && (
                <div className="mt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <Typography variant="caption1" color="muted" className="font-medium">
                      {fileList.length} file{fileList.length !== 1 ? "s" : ""} selected
                    </Typography>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      {t("helpers.clearFiles")}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {fileList.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="group/card relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-900/50"
                      >
                        {file.type === "application/pdf" ? (
                          <PdfPreview file={file} />
                        ) : (
                          <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                            <Iconify
                              icon="lucide:file-text"
                              className="size-12 text-slate-400 dark:text-slate-500"
                            />
                          </div>
                        )}
                        <div title={file.name}>
                          <Typography
                            variant="caption2"
                            className="mt-3 truncate text-center font-medium"
                          >
                            {file.name}
                          </Typography>
                        </div>
                        <Typography variant="caption2" color="muted" className="mt-0.5 text-center">
                          {inputFormatter.bytes.format(file.size.toString())}
                        </Typography>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 size-7 opacity-0 transition-opacity group-hover/card:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          aria-label={`Remove ${file.name}`}
                        >
                          <Iconify icon="lucide:x" color="white" className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(error || fieldError) && (
                <Typography variant="caption1" color="destructive" className="mt-1">
                  {fieldError?.message ? formatFormError(t, fieldError.message) : helperText}
                </Typography>
              )}
              {!error && !fieldError && helperText && (
                <Typography variant="caption1" color="muted" className="mt-1">
                  {helperText}
                </Typography>
              )}
            </div>
          );
        }}
      />
    );
  }
);
FileUpload.displayName = "FileUpload";
