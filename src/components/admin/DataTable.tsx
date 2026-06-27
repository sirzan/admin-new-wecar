import * as React from "react";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  width?: string;
}

interface DataTableProps<T> {
  data: T[] | undefined;
  columns: DataTableColumn<T>[];
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  loading?: boolean;
  emptyState?: React.ReactNode;
  toolbar?: React.ReactNode;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<T>({
  data,
  columns,
  search,
  onSearchChange,
  searchPlaceholder = "Buscar…",
  loading = false,
  emptyState,
  toolbar,
  rowKey,
  onRowClick,
  className,
  page,
  totalPages,
  onPageChange,
}: DataTableProps<T>) {
  const showSearch = onSearchChange !== undefined;
  const showPagination = page !== undefined && totalPages !== undefined && onPageChange;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn("rounded-2xl border border-border bg-card/40 overflow-hidden", className)}
    >
      {(showSearch || toolbar) && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 border-b border-border">
          {showSearch ? (
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="flex items-center gap-2 h-9 flex-1 rounded-lg border border-border bg-background/60 px-3 text-sm focus-within:border-primary/50 transition-colors">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  value={search ?? ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/70"
                />
              </div>
            </div>
          ) : (
            <span />
          )}
          {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr
              className="grid gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground border-b border-border bg-background/30"
              style={{
                gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
              }}
            >
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn("min-w-0 flex items-center font-semibold text-inherit", c.className)}
                  style={{
                    ...(c.width ? { width: c.width, minWidth: c.width } : undefined),
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="block">
            {loading ? (
              <SkeletonRows columns={columns.length} />
            ) : !data || data.length === 0 ? (
              <tr className="block">
                <td className="block">
                  <div className="py-12">
                    {emptyState ?? (
                      <div className="text-center text-sm text-muted-foreground">
                        Sin registros para mostrar.
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <motion.tr
                  key={rowKey(row)}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(idx * 0.015, 0.2) }}
                  className={cn(
                    "grid gap-4 px-5 py-3 text-sm border-b border-border/40 last:border-b-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-background/40 focus:bg-background/40",
                  )}
                  style={{
                    gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
                  }}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }}
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn("min-w-0 flex items-center text-foreground/90", c.className)}
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <div className="min-w-0 truncate">{c.cell(row)}</div>
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages! > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 text-sm">
          <span className="text-muted-foreground">
            Página {(page ?? 0) + 1} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => onPageChange!((page ?? 0) - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page! >= totalPages! - 1}
              onClick={() => onPageChange!((page ?? 0) + 1)}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function SkeletonRows({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr
          key={i}
          className="grid gap-4 px-5 py-3 border-b border-border/40 last:border-b-0 animate-pulse"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: columns }).map((__, j) => (
            <td key={j} style={{ display: "block" }}>
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Buscar…"}
      className="h-9 max-w-xs"
    />
  );
}
