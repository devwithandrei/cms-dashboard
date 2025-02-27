"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type OrderColumn = {
  id: string;
  phone: string;
  address: string;
  isPaid: boolean;
  totalPrice: string;
  amount: number;
  products: string;
  createdAt: string;
  status: string;
  customerName: string;
  customerEmail: string;
  shippingDetails: {
    address: string;
    city: string;
    country: string;
    postalCode: string;
    phone: string;
  };
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-500 dark:bg-yellow-600";
    case "PAID":
      return "bg-blue-500 dark:bg-blue-600";
    case "SHIPPED":
      return "bg-purple-500 dark:bg-purple-600";
    case "DELIVERED":
      return "bg-green-500 dark:bg-green-600";
    case "CANCELLED":
      return "bg-red-500 dark:bg-red-600";
    default:
      return "bg-gray-500 dark:bg-gray-600";
  }
};

export const columns: ColumnDef<OrderColumn>[] = [
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <div className="font-medium dark:text-white">{row.original.customerName}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
          {row.original.customerEmail}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "products",
    header: "Products",
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate dark:text-white" title={row.original.products}>
        {row.original.products}
      </div>
    ),
  },
  {
    accessorKey: "totalPrice",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className={cn(
            "whitespace-nowrap",
            "dark:text-gray-300 dark:hover:text-white"
          )}
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
   cell: ({ row }) => (
      <div className="font-medium dark:text-white">
        {formatCurrency(row.original.amount)}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="dark:text-gray-300 dark:hover:text-white"
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <Badge className={cn(
        getStatusColor(row.original.status),
        "text-white"
      )}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "shippingDetails",
    header: "Shipping",
    cell: ({ row }) => (
      <div className="text-sm max-w-[200px]">
        <div className="truncate dark:text-white" title={row.original.shippingDetails.address}>
          {row.original.shippingDetails.address}
        </div>
        <div className="text-gray-500 dark:text-gray-400 truncate" title={`${row.original.shippingDetails.city}, ${row.original.shippingDetails.country}`}>
          {row.original.shippingDetails.city}, {row.original.shippingDetails.country}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className={cn(
            "whitespace-nowrap",
            "dark:text-gray-300 dark:hover:text-white"
          )}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;
      if (!createdAt) {
        return <div className="dark:text-white">Invalid Date</div>;
      }
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) {
        return <div className="dark:text-white">Invalid Date</div>;
      }
      return (
        <div className="dark:text-white">
          {format(date, "MMM d, yyyy 'at' HH:mm")}
        </div>
      );
    },
  },
];
