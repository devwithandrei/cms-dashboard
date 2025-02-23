"use client";

import { ColumnDef } from "@tanstack/react-table";
import { OrderStatusCell } from "./order-status-cell";

import { OrderStatus } from "@prisma/client";

export type OrderColumn = {
  id: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  email: string;
  isPaid: boolean;
  totalPrice: string;
  products: string;
  status: OrderStatus;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
};

export const columns: ColumnDef<OrderColumn>[] = [
  {
    accessorKey: "products",
    header: "Products",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "totalPrice",
    header: "Total price",
  },
  {
    accessorKey: "isPaid",
    header: "Paid",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <OrderStatusCell
        initialStatus={row.original.status}
        orderId={row.original.id}
      />
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
  },
];
