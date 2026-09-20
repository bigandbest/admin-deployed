import PropTypes from "prop-types";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Skeleton } from "../UI/skeleton";
import { cn } from "../../lib/utils";

// Server-driven TanStack table: sorting and column visibility are controlled by the caller, rows are
// whatever the server returned for the current page. Sticky header inside a scroll area so wide
// tables scroll horizontally without losing the header. Sortable columns must set `enableSorting: true`.
export default function DataGrid({
  columns, data, isLoading = false, skeletonRows = 8, sorting = [], onSortingChange, columnVisibility, onRowClick,
  rowClassName, maxHeight = "calc(100vh - 22rem)", getRowId,
}) {
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: { sorting, columnVisibility },
    onSortingChange,
    manualSorting: true,
    enableSortingRemoval: false,
    defaultColumn: { enableSorting: false },
    getCoreRowModel: getCoreRowModel(),
  });

  const visibleCount = table.getVisibleLeafColumns().length;

  return (
    <div className="overflow-auto" style={{ maxHeight }}>
      <table className="w-full caption-bottom text-sm">
        <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b">
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const dir = header.column.getIsSorted();
                const align = header.column.columnDef.meta?.align;
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : undefined}
                    className={cn("h-10 whitespace-nowrap px-3 text-left text-xs font-medium text-muted-foreground", align === "right" && "text-right", align === "center" && "text-center")}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn("inline-flex items-center gap-1 rounded hover:text-foreground focus-visible:outline-2", align === "right" && "flex-row-reverse")}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {dir === "asc" ? <ArrowUp className="size-3" /> : dir === "desc" ? <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-40" />}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading
            ? [...Array(skeletonRows)].map((_, i) => (
              <tr key={i} className="border-b">
                {table.getVisibleLeafColumns().map((c) => (
                  <td key={c.id} className="px-3 py-2.5"><Skeleton className="h-4 w-full max-w-[140px]" /></td>
                ))}
              </tr>
            ))
            : table.getRowModel().rows.length === 0
              ? <tr><td colSpan={visibleCount} className="py-16 text-center text-muted-foreground">No results</td></tr>
              : table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn("border-b transition-colors hover:bg-muted/40", onRowClick && "cursor-pointer", typeof rowClassName === "function" ? rowClassName(row.original) : rowClassName)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const align = cell.column.columnDef.meta?.align;
                    return (
                      <td key={cell.id} className={cn("px-3 py-2.5 align-middle", align === "right" && "text-right", align === "center" && "text-center")}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

DataGrid.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  isLoading: PropTypes.bool,
  skeletonRows: PropTypes.number,
  sorting: PropTypes.array,
  onSortingChange: PropTypes.func,
  columnVisibility: PropTypes.object,
  onRowClick: PropTypes.func,
  rowClassName: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  maxHeight: PropTypes.string,
  getRowId: PropTypes.func,
};
