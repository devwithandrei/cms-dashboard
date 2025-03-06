"use client"

import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "./cell-action";

export type DescriptionColumn = {
  id: string;
  name: string;
  value: string;
  createdAt: string;
  usedByProducts: {
    id: string;
    name: string;
  }[];
}

export const columns: ColumnDef<DescriptionColumn>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "value",
    header: "Value",
  },
  {
    accessorKey: "usedByProducts",
    header: "Usage Status",
    cell: ({ row }) => {
      const products = row.original.usedByProducts;
      return (
        <div className="flex flex-col gap-2">
          <Badge
            variant={products.length > 0 ? "default" : "secondary"}
            className="w-fit"
          >
            {products.length > 0 ? "In Use" : "Not Used"}
          </Badge>
          {products.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Used by: {products.map(p => p.name).join(", ")}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original as DescriptionColumn} />
  },
];
