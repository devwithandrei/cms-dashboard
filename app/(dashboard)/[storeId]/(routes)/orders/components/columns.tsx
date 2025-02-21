"use client";

import { ColumnDef } from "@tanstack/react-table";

export type OrderColumn = {
  id: string;
  phone: string;
  address: string;
  isPaid: boolean;
  products: string;
  totalPrice: string;
  status: 'pending' | 'paid' | 'delivered' | 'canceled';
  createdAt: string;
  customerEmail: string;
  customerName: string;
  city: string;
  country: string;
  postalCode: string;
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
    accessorKey: "email",
    header: "Email Address",
  },
  {
    accessorKey: "totalPrice",
    header: "Total price",
  },
];