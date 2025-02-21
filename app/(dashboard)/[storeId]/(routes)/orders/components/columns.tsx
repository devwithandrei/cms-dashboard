"use client";

import { ColumnDef } from "@tanstack/react-table";
import { OrderStatus } from "@/types";
import { OrderStatusCell } from "./order-status-cell";

export type OrderColumn = {
  id: string;
  phone: string;
  address: string;
  products: string;
  totalPrice: string;
  status: OrderStatus;
  createdAt: string;
  customerEmail: string;
  customerName: string;
  city: string;
  country: string;
  postalCode: string;
  storeId: string;
  orderItems?: {
    id: string;
    productId: string;
    quantity: number;
    price: string;
    size?: { id: string; name: string } | null;
    color?: { id: string; name: string } | null;
  }[];
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
    accessorKey: "city",
    header: "City",
  },
  {
    accessorKey: "country",
    header: "Country",
  },
  {
    accessorKey: "postalCode",
    header: "Postal Code",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <OrderStatusCell
        initialStatus={row.original.status}
        orderId={row.original.id}
        storeId={row.original.storeId}
      />
    )
  },
  {
    accessorKey: "totalPrice",
    header: "Total Price",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
  },
  {
    accessorKey: "customerEmail",
    header: "Email Address",
  },
  {
    accessorKey: "customerName",
    header: "Customer Name",
  },
];