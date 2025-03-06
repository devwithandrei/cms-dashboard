"use client";

import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DataTableProps<TData extends object, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey: string | string[];
  searchPlaceholder?: string;
  onRowSelectionChange?: (selectedRowIds: string[]) => void;
}

export function DataTable<TData extends object, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search",
  onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: (updatedSelection) => {
      setRowSelection(updatedSelection);
      if (onRowSelectionChange) {
        // Handle the selection state properly by ensuring we're working with the actual state object
        const selectionState = typeof updatedSelection === 'function' 
          ? updatedSelection(rowSelection)
          : updatedSelection;
          
        const selectedRowIds = Object.entries(selectionState)
          .filter(([_, selected]) => selected)
          .map(([key, _]) => {
            // We know the row exists based on the key
            const rowData = table.getRow(key).original;
            // Use type assertion with 'as' to tell TypeScript that we expect an 'id' property
            // or provide a fallback if it doesn't exist
            return ('id' in rowData ? String(rowData.id) : key);
          });
        onRowSelectionChange(selectedRowIds);
      }
    },
    state: {
      columnFilters,
      globalFilter,
      rowSelection,
    },
    onGlobalFilterChange: setGlobalFilter,
  });
  
  const handleSearch = (value: string) => {
    setGlobalFilter(value);
  };
  return (
    <div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(event) => handleSearch(event.target.value)}
          className={cn(
            "w-full sm:max-w-sm",
            "dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
          )}
        />
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {table.getFilteredRowModel().rows.length} of {data.length} results
        </div>
      </div>
      <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="dark:border-gray-700">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="dark:text-gray-300">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="dark:text-gray-300">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center dark:text-gray-400"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
