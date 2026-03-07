import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface DataTableProps<T> {
  columns: Array<{
    key: keyof T;
    label: string;
    render?: (value: any, row: T) => React.ReactNode;
    width?: string;
    align?: "left" | "center" | "right";
  }>;
  data: T[];
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  isLoading?: boolean;
}

export function DataTable<T extends { id?: number | string }>({
  columns,
  data,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  isLoading = false,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedData = useMemo(() => data.slice(startIndex, endIndex), [data, startIndex, endIndex]);

  const handlePageChange = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const handlePageSizeChange = (size: string) => {
    const newSize = size === "all" ? totalItems : parseInt(size);
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const getAlignClass = (align?: string) => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "text-left";
  };

  return (
    <div className="space-y-4">
      {/* Table Header: Per-Page Selector only */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show per page:</span>
          <Select value={pageSize === totalItems ? "all" : String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-24 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
              {totalItems > Math.max(...pageSizeOptions) && (
                <SelectItem value="all">All</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-secondary border-b border-border text-sidebar">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider ${getAlignClass(col.align)}`}
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card">
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {columns.map((col, j) => (
                    <td key={j} className="px-4 py-4">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={row.id ?? idx} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  {columns.map((col) => (
                    <td key={String(col.key)} className={`px-4 py-3.5 text-sm ${getAlignClass(col.align)}`} style={{ width: col.width }}>
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground text-sm italic">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: Results Info & Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Results Info */}
        <div className="text-sm text-muted-foreground">
          {totalItems > 0 ? (
            <>
              Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
              <span className="font-medium text-foreground">{endIndex}</span> of{" "}
              <span className="font-medium text-foreground">{totalItems}</span> results
            </>
          ) : (
            "No results"
          )}
        </div>

        {/* Right: Pagination Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1 px-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
