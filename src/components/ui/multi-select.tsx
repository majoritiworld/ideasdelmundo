"use client";

import * as React from "react";
import Iconify from "@/components/ui/iconify";
import type { MultiSelectOption } from "@/types/ui.types";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/** Resolve option / group labels: keys with a dot use the `forms` namespace; plain strings pass through. */
function useFormLabel() {
  const tForms = useTranslations("forms");
  return React.useCallback(
    (key: string) => {
      if (key.includes(".")) return tForms(key as never);
      return key;
    },
    [tForms]
  );
}

type MultiSelectProps = {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  maxDisplay?: number;
  maxSelected?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  defaultExpandAll?: boolean;
  onlyDeselectAll?: boolean;
  allSelectedLabel?: string;
};

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  className,
  maxDisplay = 2,
  maxSelected,
  searchable = false,
  searchPlaceholder,
  defaultExpandAll = true,
  onlyDeselectAll = false,
  allSelectedLabel = "all",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const t = useTranslations();
  const labelText = useFormLabel();

  type FlatOpt = {
    option: MultiSelectOption;
    level: number;
    hasChildren: boolean;
  };

  const collectFolderValues = React.useCallback((opts: MultiSelectOption[]) => {
    const out: string[] = [];
    const walk = (arr: MultiSelectOption[]) => {
      for (const o of arr) {
        const hasChildren = Array.isArray(o.children) && o.children.length > 0;
        if (hasChildren) out.push(o.value);
        if (hasChildren) walk(o.children!);
      }
    };
    walk(opts);
    return out;
  }, []);

  const collectLeafValues = React.useCallback((opt: MultiSelectOption) => {
    const walk = (option: MultiSelectOption): string[] => {
      const hasChildren = Array.isArray(option.children) && option.children.length > 0;
      if (!hasChildren) return [option.value];
      return (option.children ?? []).flatMap(walk);
    };
    return walk(opt);
  }, []);

  const [expanded, setExpanded] = React.useState<Set<string>>(() => {
    if (!defaultExpandAll) return new Set();
    return new Set(collectFolderValues(options));
  });

  React.useEffect(() => {
    if (!defaultExpandAll) return;
    setExpanded(new Set(collectFolderValues(options)));
  }, [collectFolderValues, defaultExpandAll, options]);

  const flattenVisible = React.useCallback(
    (opts: MultiSelectOption[], lvl: number, out: FlatOpt[]) => {
      const walk = (items: MultiSelectOption[], level: number) => {
        for (const option of items) {
          const hasChildren = Array.isArray(option.children) && option.children.length > 0;
          out.push({ option, level, hasChildren });
          if (hasChildren && expanded.has(option.value)) {
            walk(option.children ?? [], level + 1);
          }
        }
      };
      walk(opts, lvl);
    },
    [expanded]
  );

  const flattenAll = React.useCallback((opts: MultiSelectOption[]) => {
    const out: FlatOpt[] = [];
    const walk = (arr: MultiSelectOption[], lvl: number) => {
      for (const o of arr) {
        const hasChildren = Array.isArray(o.children) && o.children.length > 0;
        out.push({ option: o, level: lvl, hasChildren });
        if (hasChildren) walk(o.children!, lvl + 1);
      }
    };
    walk(opts, 0);
    return out;
  }, []);

  const visibleOptions = React.useMemo(() => {
    const out: FlatOpt[] = [];
    flattenVisible(options, 0, out);
    return out;
  }, [flattenVisible, options]);

  const allOptionsFlat = React.useMemo(() => flattenAll(options), [flattenAll, options]);

  const filteredOptions = React.useMemo(() => {
    const source = searchValue ? allOptionsFlat : visibleOptions;
    if (!searchValue) return source;
    const q = searchValue.toLowerCase();
    return source.filter((o) => labelText(o.option.label).toLowerCase().includes(q));
  }, [allOptionsFlat, searchValue, visibleOptions, labelText]);

  // Group options by their group field for rendering
  const groupedOptions = React.useMemo(() => {
    const groups: { label: string | undefined; items: FlatOpt[] }[] = [];
    const seen = new Map<string | undefined, FlatOpt[]>();
    for (const opt of filteredOptions) {
      const key = opt.option.group;
      if (!seen.has(key)) {
        const items: FlatOpt[] = [];
        seen.set(key, items);
        groups.push({ label: key, items });
      }
      seen.get(key)!.push(opt);
    }
    return groups;
  }, [filteredOptions]);

  const hasGroups = React.useMemo(
    () => groupedOptions.some((g) => g.label !== undefined),
    [groupedOptions]
  );

  React.useEffect(() => {
    if (!open) {
      setSearchValue("");
    } else if (searchable) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, searchable]);

  const handleToggle = (value: string) => {
    const flat = allOptionsFlat.find((o) => o.option.value === value);
    const opt = flat?.option;
    if (!opt || opt.disabled) return;

    const hasChildren = flat?.hasChildren ?? false;
    const valuesToToggle = hasChildren ? collectLeafValues(opt) : [value];
    const allSelected = valuesToToggle.every((v) => selected.includes(v));

    if (allSelected) {
      const toRemove = new Set(valuesToToggle);
      onChange(selected.filter((v) => !toRemove.has(v)));
    } else {
      const toAdd = valuesToToggle.filter((v) => !selected.includes(v));
      if (typeof maxSelected === "number") {
        const remaining = maxSelected - selected.length;
        if (remaining <= 0) return;
        onChange([...selected, ...toAdd.slice(0, remaining)]);
      } else {
        onChange([...selected, ...toAdd]);
      }
    }
  };

  const handleSelectAll = () => {
    const targetValues = filteredOptions
      .map((o) => o.option)
      .filter((opt) => !opt.disabled)
      .map((opt) => opt.value);
    const allTargetSelected = targetValues.every((v) => selected.includes(v));

    if (allTargetSelected) {
      onChange(selected.filter((v) => !targetValues.includes(v)));
    } else {
      const newSelected = [...new Set([...selected, ...targetValues])];
      onChange(typeof maxSelected === "number" ? newSelected.slice(0, maxSelected) : newSelected);
    }
  };

  const allFilteredSelected = React.useMemo(() => {
    const enabled = filteredOptions.map((o) => o.option).filter((opt) => !opt.disabled);
    return enabled.length > 0 && enabled.every((opt) => selected.includes(opt.value));
  }, [filteredOptions, selected]);

  const selectedOptions = React.useMemo(() => {
    const all = allOptionsFlat.map((o) => o.option);
    return all.filter((opt) => selected.includes(opt.value));
  }, [allOptionsFlat, selected]);

  const displayText = React.useMemo(() => {
    if (selected.length === 0) return placeholder || t("select");
    const enabled = allOptionsFlat
      .map((o) => o.option)
      .filter((o) => !o.disabled)
      .map((o) => o.value);
    if (enabled.length > 0 && enabled.every((v) => selected.includes(v))) {
      return t(allSelectedLabel);
    }
    if (selected.length <= maxDisplay) {
      return selectedOptions.map((opt) => labelText(opt.label)).join(", ");
    }
    return `${selected.length} ${t("selected")}`;
  }, [
    allOptionsFlat,
    maxDisplay,
    placeholder,
    selected,
    selectedOptions,
    t,
    allSelectedLabel,
    labelText,
  ]);

  const toggleFolder = (value: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            "border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
            selected.length === 0 && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{displayText}</span>
          <Iconify
            icon="lucide:chevron-down"
            className={cn(
              "size-4 shrink-0 opacity-50 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[200px] p-0"
        align="start"
      >
        <div className="flex max-h-[320px] flex-col">
          {searchable && (
            <div className="border-border border-b p-2">
              <div className="relative">
                <Iconify
                  icon="lucide:search"
                  className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="placeholder:text-muted-foreground h-8 w-full rounded-sm border-0 bg-transparent py-1 pr-2 pl-8 text-sm outline-none"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => setSearchValue("")}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-0.5"
                  >
                    <Iconify icon="lucide:x" className="size-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="border-border flex items-center gap-2 border-b px-2 py-1.5">
            {onlyDeselectAll ? (
              <button
                onClick={() => onChange([])}
                disabled={selected.length === 0}
                type="button"
                className="text-muted-foreground hover:text-foreground text-xs transition-colors disabled:opacity-40"
              >
                {t("deselectAll")}
              </button>
            ) : (
              <button
                onClick={handleSelectAll}
                type="button"
                className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              >
                {allFilteredSelected ? t("deselectAll") : t("selectAll")}
              </button>
            )}
            {selected.length > 0 && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                  {selected.length}
                </Badge>
              </>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="text-muted-foreground px-2 py-4 text-center text-sm">
                {t("noResults")}
              </div>
            ) : (
              groupedOptions.map((group, gi) => (
                <React.Fragment key={group.label ?? "__ungrouped__"}>
                  {hasGroups && group.label && (
                    <>
                      {gi > 0 && <div className="bg-border pointer-events-none -mx-1 my-1 h-px" />}
                      <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                        {group.label ? labelText(group.label) : null}
                      </div>
                    </>
                  )}
                  {group.items.map(({ option, level, hasChildren }) => {
                    const valuesToCheck = hasChildren ? collectLeafValues(option) : [option.value];
                    const isSelected =
                      valuesToCheck.length > 0 && valuesToCheck.every((v) => selected.includes(v));
                    const isExpanded = hasChildren ? expanded.has(option.value) : false;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleToggle(option.value)}
                        disabled={option.disabled}
                        className={cn(
                          "focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm transition-colors outline-none select-none",
                          "hover:bg-accent hover:text-accent-foreground",
                          isSelected && "bg-accent/50",
                          option.disabled && "pointer-events-none cursor-not-allowed opacity-50"
                        )}
                        style={{ paddingLeft: 8 + level * 24 }}
                      >
                        {hasChildren && (
                          <span
                            className="text-muted-foreground flex size-4 shrink-0 items-center justify-center"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFolder(option.value);
                            }}
                            role="button"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                          >
                            <Iconify
                              icon={isExpanded ? "lucide:chevron-down" : "lucide:chevron-right"}
                              className="size-3.5"
                            />
                          </span>
                        )}

                        {option.icon && <span className="shrink-0">{option.icon}</span>}
                        {option.color && (
                          <span className={cn("size-2 shrink-0 rounded-full", option.color)} />
                        )}
                        <span className="flex-1 truncate text-left">{labelText(option.label)}</span>

                        <span className="absolute right-2 flex size-3.5 items-center justify-center">
                          {isSelected && <Iconify icon="lucide:check" className="size-3.5" />}
                        </span>
                      </button>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export type { MultiSelectProps };
export default MultiSelect;
