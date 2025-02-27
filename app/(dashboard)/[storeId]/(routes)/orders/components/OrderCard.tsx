"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Package, Truck, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderColumn } from "./columns";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";

interface OrderCardProps {
  order: OrderColumn;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onDelete: (orderId: string) => void;
  loading: boolean;
  selectedOrder: string | null;
  currentStatus: "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
}

export const OrderCard = ({
  order,
  onStatusChange,
  onDelete,
  loading,
  selectedOrder,
  currentStatus
}: OrderCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-6 h-6" />;
      case "PAID":
        return <Package className="w-6 h-6" />;
      case "SHIPPED":
        return <Truck className="w-6 h-6" />;
      case "DELIVERED":
        return <CheckCircle className="w-6 h-6" />;
      case "CANCELLED":
        return <XCircle className="w-6 h-6" />;
      default:
        return null;
    }
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

  const getNextStatus = (status: string) => {
    switch (status) {
      case "PAID":
        return ["SHIPPED", "CANCELLED"];
      case "SHIPPED":
        return ["DELIVERED", "CANCELLED"];
      case "DELIVERED":
        return [];
      case "CANCELLED":
        return [];
      default:
        return [];
    }
  };

  const nextStatuses = getNextStatus(order.status);

  const isLoading = selectedOrder === order.id && loading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <Card className="p-6 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 border-0 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold dark:text-white">Order #{order.id.slice(0, 8)}</h3>
              <Badge className={cn(getStatusColor(order.status), "text-white")}>
                {order.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {format(new Date(order.createdAt), "MMMM d, yyyy 'at' HH:mm")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn("p-2 rounded-full", getStatusColor(order.status))}
            >
              {getStatusIcon(order.status)}
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer</p>
            <p className="font-medium dark:text-white">{order.customerName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{order.customerEmail}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</p>
            <p className="font-medium dark:text-white">{formatCurrency(order.amount)}</p>
          </div>
        </div>

        <Button
          onClick={() => setExpanded(!expanded)}
          variant="ghost"
          className="w-full flex justify-between items-center mb-4"
        >
          <span>View Details</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {expanded && (
          <>
            <Separator className="my-4" />
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Products</p>
                <p className="dark:text-white">{order.products}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Shipping Details</p>
                <div className="space-y-1 dark:text-white">
                  <p>{order.shippingDetails.address}</p>
                  <p>{order.shippingDetails.city}, {order.shippingDetails.country}</p>
                  <p>Postal Code: {order.shippingDetails.postalCode}</p>
                  <p>Phone: {order.shippingDetails.phone}</p>
                </div>
              </div>
            </div>
          </>
        )}

        <Separator className="my-4" />
        
        <div className="flex items-center gap-2 justify-end">
          <div className="flex items-center gap-2">
            {nextStatuses.map((status) => (
              <Button
                key={status}
                onClick={() => onStatusChange(order.id, status)}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-2",
                  status === "CANCELLED" 
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700",
                  "text-white",
                  "dark:text-white",
                  "transition-colors duration-200"
                )}
              >
                {isLoading && selectedOrder === order.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  getStatusIcon(status)
                )}
                Mark as {status.toLowerCase()}
              </Button>
            ))}
          </div>
          <Button
            onClick={() => onDelete(order.id)}
            disabled={isLoading}
            variant="destructive"
            className={cn(
              "flex items-center gap-2",
              "dark:bg-red-600 dark:hover:bg-red-700"
            )}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
