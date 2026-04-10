"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { columns } from "@/components/transactions/columns";
import type { TransactionWithCategory } from "@/app/actions/analytics-actions";

const SORTABLE_COLUMNS = new Set(["transaction_date", "amount_cents"]);

interface TransactionDataTableProps {
  data: TransactionWithCategory[];
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (columnId: string) => void;
}

export function TransactionDataTable({
  data,
  sortBy,
  sortDir,
  onSort,
}: TransactionDataTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const columnId = header.column.id;
              const isSortable = SORTABLE_COLUMNS.has(columnId);
              const isActive = sortBy === columnId;
              const ariaSortValue = isActive
                ? sortDir === "asc"
                  ? "ascending"
                  : "descending"
                : "none";

              // Width classes per column
              const widthClass =
                columnId === "transaction_date"
                  ? "w-[120px]"
                  : columnId === "category"
                    ? "w-[160px]"
                    : columnId === "amount_cents"
                      ? "w-[120px] text-right"
                      : "";

              return (
                <TableHead
                  key={header.id}
                  className={`text-sm font-bold ${widthClass} ${isSortable ? "cursor-pointer select-none" : ""}`}
                  aria-sort={
                    isSortable
                      ? (ariaSortValue as "ascending" | "descending" | "none")
                      : undefined
                  }
                  onClick={isSortable ? () => onSort(columnId) : undefined}
                >
                  <span
                    className={`inline-flex items-center gap-1 ${
                      columnId === "amount_cents" ? "justify-end" : ""
                    }`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    {isSortable &&
                      (isActive ? (
                        sortDir === "asc" ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                      ))}
                  </span>
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row, index) => (
            <TableRow
              key={row.id}
              className={`h-12 ${
                index % 2 === 0 ? "bg-secondary-background" : "bg-background"
              } hover:bg-background`}
            >
              {row.getVisibleCells().map((cell) => {
                const columnId = cell.column.id;
                const cellClass =
                  columnId === "amount_cents" ? "text-right tabular-nums" : "";

                return (
                  <TableCell key={cell.id} className={cellClass}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                );
              })}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
