"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import Iconify from "@/components/ui/iconify";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------

export type SortDirection = "asc" | "desc" | null;

export type ColumnDef<T> = {
  /** Unique key — maps to a property in the data row */
  key: keyof T | string;
  /** Column header label */
  header: string;
  /** Custom cell renderer; receives the row and column key */
  cell?: (row: T) => React.ReactNode;
  /** Allow sorting on this column (default: false) */
  sortable?: boolean;
  /** Additional class for the <th> element */
  headerClassName?: string;
  /** Additional class for the <td> element */
  cellClassName?: string;
};

export type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  /** Show a search bar above the table */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Keys to search across (defaults to all string/number columns) */
  searchKeys?: Array<keyof T>;
  /** Rows per page (default 10; pass 0 to disable pagination) */
  pageSize?: number;
  className?: string;
  /** Optional stable row key extractor for pagination/sorting correctness */
  getRowKey?: (row: T, index: number) => React.Key;
  /** Optional class for the table scroll container */
  tableContainerClassName?: string;
  /** Rendered when data is empty */
  emptyState?: React.ReactNode;
};

function getNestedValue<T>(row: T, key: string): unknown {
  return key.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[k];
    return undefined;
  }, row);
}

/**
 * Generic client-side DataTable with sorting, search, and pagination.
 *
 * @example
 * <DataTable
 *   data={users}
 *   columns={[
 *     { key: "name", header: "Name", sortable: true },
 *     { key: "email", header: "Email" },
 *     { key: "id", header: "Actions", cell: (row) => <DeleteButton id={row.id} /> }
 *   ]}
 *   pageSize={10}
 *   searchable
 * />
 */
export function DataTable<T extends object>({
  data,
  columns,
  searchable = false,
  searchPlaceholder = "Search…",
  searchKeys,
  pageSize = 10,
  className,
  getRowKey,
  tableContainerClassName,
  emptyState,
}: DataTableProps<T>) {
  const t = useTranslations();
  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDirection>(null);
  const [page, setPage] = React.useState(1);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const filtered = React.useMemo(() => {
    if (!query) return data;
    const q = query.toLowerCase();
    const keys =
      searchKeys ??
      (columns
        .map((c) => c.key)
        .filter((k) => {
          const sample = getNestedValue(data[0], String(k));
          return typeof sample === "string" || typeof sample === "number";
        }) as Array<keyof T>);

    return data.filter((row) =>
      keys.some((k) => {
        const val = getNestedValue(row, String(k));
        return String(val ?? "")
          .toLowerCase()
          .includes(q);
      })
    );
  }, [data, query, columns, searchKeys]);

  const sorted = React.useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const av = getNestedValue(a, sortKey);
      const bv = getNestedValue(b, sortKey);
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av ?? "").localeCompare(String(bv ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const paginated = React.useMemo(() => {
    if (pageSize === 0) return sorted;
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const totalPages = pageSize === 0 ? 1 : Math.ceil(sorted.length / pageSize);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(Math.max(totalPages, 1));
    }
  }, [page, totalPages]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {searchable && (
        <SearchInput
          onSearch={(q) => {
            setQuery(q);
            setPage(1);
          }}
          placeholder={searchPlaceholder}
        />
      )}

      <div className="rounded-md border">
        <Table containerClassName={cn("overflow-auto", tableContainerClassName)}>
          <TableHeader className="bg-background sticky top-0 z-10">
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={String(col.key)}
                  className={cn(col.sortable && "cursor-pointer select-none", col.headerClassName)}
                  onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
                >
                  <Typography
                    variant="label2"
                    as="span"
                    className="text-foreground flex items-center gap-1 text-sm font-medium"
                  >
                    {col.header}
                    {col.sortable && (
                      <Iconify
                        icon={
                          sortKey === String(col.key) && sortDir === "asc"
                            ? "lucide:chevron-up"
                            : sortKey === String(col.key) && sortDir === "desc"
                              ? "lucide:chevron-down"
                              : "lucide:chevrons-up-down"
                        }
                        className="text-muted-foreground size-3.5"
                      />
                    )}
                  </Typography>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  {emptyState ?? (
                    <Typography variant="caption2" as="span" color="muted">
                      {t("noResults")}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row, rowIndex) => (
                <TableRow
                  key={
                    getRowKey
                      ? getRowKey(row, rowIndex)
                      : String(getNestedValue(row, "id") ?? `${page}-${rowIndex}`)
                  }
                >
                  {columns.map((col) => (
                    <TableCell key={String(col.key)} className={col.cellClassName}>
                      {col.cell
                        ? col.cell(row)
                        : String(getNestedValue(row, String(col.key)) ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pageSize > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Typography variant="caption2" as="span" color="muted">
            {t("resultsCount", { count: sorted.length })}
          </Typography>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
