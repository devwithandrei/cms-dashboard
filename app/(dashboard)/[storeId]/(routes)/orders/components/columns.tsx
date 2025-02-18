"use client";

import { ColumnDef } from "@tanstack/react-table";

export type OrderColumn = {
  id: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  email: string;
  paidProducts: string; // For paid products
  unpaidProducts: string; // For unpaid products
  totalPrice: string;
  createdAt: string;
}

export const columns: ColumnDef<OrderColumn>[] = [
  {
    accessorKey: "paidProducts", // New column for paid products
    header: "Paid Products",
  },
  {
    accessorKey: "unpaidProducts", // New column for unpaid products
    header: "Unpaid Products",
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
    accessorKey: "email",
    header: "Email Address",
  },
  {
    accessorKey: "totalPrice",
    header: "Total price",
  },
];