"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { Badge } from "@/components/ui/badge";

export type UserColumn = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  createdAt: string;
  status: "active" | "inactive" | "pending";
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: Date | null;
  wishlistCount: number;
};

export const columns: ColumnDef<UserColumn>[] = [
  {
    accessorKey: "id",
    header: "User ID",
    cell: ({ row }) => (
      <div className="max-w-[100px] truncate" title={row.getValue("id")}>
        {row.getValue("id")}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate" title={row.getValue("email")}>
        {row.getValue("email")}
      </div>
    ),
  },
  {
    accessorKey: "firstName",
    header: "First Name",
  },
  {
    accessorKey: "lastName",
    header: "Last Name",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge 
        variant={
          row.original.status === "active" 
            ? "default" 
            : row.original.status === "pending" 
              ? "outline"
              : "secondary"
        }
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "ordersCount",
    header: "Orders",
  },
  {
    accessorKey: "totalSpent",
    header: "Total Spent",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalSpent"));
      const formatted = new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR"
      }).format(amount);
      return formatted;
    }
  },
  {
    accessorKey: "wishlistCount",
    header: "Wishlist Items",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
