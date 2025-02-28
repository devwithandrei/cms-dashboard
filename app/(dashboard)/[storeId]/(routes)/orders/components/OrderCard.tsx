"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Package, Truck, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderColumn } from "./columns";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { toast } from "react-hot-toast";

interface OrderCardProps {
  order: OrderColumn;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onDelete: (orderId: string) => void;
  loading: boolean;
  selectedOrder: string | null;
  currentStatus: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  storeId?: string;
}

export const OrderCard = ({
  order,
  onStatusChange,
  onDelete,
  loading,
  selectedOrder,
  currentStatus,
  storeId
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
      case "PENDING":
        return ["PAID", "CANCELLED"];
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

  const copyToClipboard = (text: string) => {
    if (text) {
      try {
        navigator.clipboard.writeText(text);
        toast.success("User ID copied to clipboard", {
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
          icon: '📋',
        });
      } catch (err) {
        console.error('Failed to copy: ', err);
        toast.error("Failed to copy to clipboard");
      }
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
            {order.userId && (
              <>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 text-xs">
                    <span className="text-gray-600 dark:text-gray-300 font-medium truncate max-w-[120px]">
                      {order.userId}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 rounded-full bg-white dark:bg-gray-600 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200 shadow-sm"
                      onClick={() => copyToClipboard(order.userId || "")}
                    >
                      <Copy className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                    </Button>
                  </div>
                </div>
                {storeId && (
                  <p className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer mt-1">
                    <a href={`/${storeId}/users`} target="_blank" rel="noopener noreferrer">
                      View User Profile
                    </a>
                  </p>
                )}
              </>
            )}
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
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Products</p>
                {order.orderItems && order.orderItems.length > 0 ? (
                  <div className="space-y-3">
                    {order.orderItems.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 dark:text-white">{item.productName}</p>
                            {(item.size || item.color) && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {item.size && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    Size: {item.size}
                                  </span>
                                )}
                                {item.color && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                    Color: {item.color}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-end">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="dark:text-white">{order.products}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Shipping Details</p>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Address:</span>
                        <span className="text-sm font-medium text-gray-800 dark:text-white">{order.shippingDetails.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">City/Country:</span>
                        <span className="text-sm font-medium text-gray-800 dark:text-white">{order.shippingDetails.city}, {order.shippingDetails.country}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Postal Code:</span>
                        <span className="text-sm font-medium text-gray-800 dark:text-white">{order.shippingDetails.postalCode}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone:</span>
                        <span className="text-sm font-medium text-gray-800 dark:text-white">{order.shippingDetails.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <Separator className="my-4" />
        
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-end">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
            {nextStatuses.map((status) => (
              <Button
                key={status}
                onClick={() => onStatusChange(order.id, status)}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-2 rounded-full shadow-sm",
                  status === "CANCELLED" 
                    ? "bg-red-500 hover:bg-red-600"
                    : status === "PAID"
                      ? "bg-blue-500 hover:bg-blue-600"
                      : status === "SHIPPED"
                        ? "bg-purple-500 hover:bg-purple-600"
                        : "bg-green-500 hover:bg-green-600",
                  "text-white",
                  "dark:text-white",
                  "transition-all duration-200 transform hover:scale-105"
                )}
              >
                {isLoading && selectedOrder === order.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  getStatusIcon(status)
                )}
                <span className="hidden sm:inline">Mark as</span> {status.toLowerCase()}
              </Button>
            ))}
          </div>
          <Button
            onClick={() => onDelete(order.id)}
            disabled={isLoading}
            variant="destructive"
            className={cn(
              "flex items-center gap-2 rounded-full shadow-sm",
              "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700",
              "transition-all duration-200 transform hover:scale-105"
            )}
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
