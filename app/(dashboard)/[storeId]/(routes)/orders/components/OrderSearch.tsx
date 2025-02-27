"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderColumn } from "./columns";
import { cn } from "@/lib/utils";

interface OrderSearchProps {
  onSearch: (filteredOrders: OrderColumn[]) => void;
  orders: OrderColumn[];
}

export const OrderSearch = ({ onSearch, orders }: OrderSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSearch = (searchTerm: string, status: string, sort: string) => {
    let filtered = [...orders];

    // Apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.customerName.toLowerCase().includes(searchLower) ||
        order.customerEmail.toLowerCase().includes(searchLower) ||
        order.products.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower) ||
        order.shippingDetails.address.toLowerCase().includes(searchLower) ||
        order.shippingDetails.city.toLowerCase().includes(searchLower) ||
        order.shippingDetails.country.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (status) {
      filtered = filtered.filter(order => order.status === status);
    }

    // Apply sorting
    if (sort) {
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (sort) {
          case "date":
            comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            break;
          case "amount":
            comparison = b.amount - a.amount;
            break;
          case "status":
            comparison = a.status.localeCompare(b.status);
            break;
          case "customer":
            comparison = a.customerName.localeCompare(b.customerName);
            break;
        }
        return sortOrder === "asc" ? -comparison : comparison;
      });
    }

    onSearch(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setSortBy("");
    setSortOrder("desc");
    handleSearch("", "", "");
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search orders by customer, products, or address..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleSearch(e.target.value, statusFilter, sortBy);
            }}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className={cn(
            "flex items-center gap-2",
            showFilters && "bg-gray-100 dark:bg-gray-800"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
        {(searchTerm || statusFilter || sortBy) && (
          <Button
            onClick={clearFilters}
            variant="outline"
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              handleSearch(searchTerm, value, sortBy);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value) => {
              setSortBy(value);
              handleSearch(searchTerm, statusFilter, value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No Sorting</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="customer">Customer Name</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortOrder}
            onValueChange={(value: "asc" | "desc") => {
              setSortOrder(value);
              handleSearch(searchTerm, statusFilter, sortBy);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
