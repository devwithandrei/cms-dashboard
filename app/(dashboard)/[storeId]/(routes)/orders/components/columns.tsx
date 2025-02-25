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
  amount: string;
  products: string;
  status: OrderStatus;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  userId: string;
  userEmail: string;
  userName: string;
};

export const columns: ColumnDef<OrderColumn>[] = [
  {
    accessorKey: "userName",
    header: "Name",
    cell: ({ row }) => row.original.userName
  },
  {
    accessorKey: "userEmail",
    header: "Email",
    cell: ({ row }) => row.original.userEmail
  },
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
    accessorKey: "amount",
    header: "Total Amount",
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
