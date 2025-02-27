"use client";

import { useState, useEffect } from "react";
import { OrderColumn } from "./components/columns";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./components/columns";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { AlertModal } from "@/components/modals/alert-modal";
import { cn } from "@/lib/utils";

interface OrdersClientProps {
  orders: OrderColumn[];
  storeId: string;
  isPaidSection: boolean;
}

const OrdersClient: React.FC<OrdersClientProps> = ({
  orders,
  storeId,
  isPaidSection
}) => {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [localOrders, setLocalOrders] = useState(orders);

  // Setup SSE for real-time updates
  useEffect(() => {
    const eventSource = new EventSource(`/api/${storeId}/orders/events`);

    eventSource.onmessage = (event) => {
      const updatedOrder = JSON.parse(event.data);
      setLocalOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
        )
      );
    };

    return () => {
      eventSource.close();
    };
  }, [storeId]);

  // Update local orders when prop changes
  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);
  const [open, setOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setLoading(true);
      setSelectedOrder(orderId);

      const response = await axios.patch(`/api/${storeId}/orders/${orderId}`, {
        status: newStatus
      });

      // Update local state immediately
      setLocalOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast.success('Order status updated successfully');
    } catch (error) {
      toast.error('Error updating order status');
    } finally {
      setLoading(false);
      setSelectedOrder(null);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);

      await axios.delete(`/api/${storeId}/orders/${orderToDelete}`);

      // Update local state immediately
      setLocalOrders(prevOrders => 
        prevOrders.filter(order => order.id !== orderToDelete)
      );

      toast.success('Order deleted successfully');
      setOpen(false);
    } catch (error) {
      toast.error('Error deleting order');
    } finally {
      setLoading(false);
      setOrderToDelete(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <Package className="w-4 h-4" />;
      case "SHIPPED":
        return <Truck className="w-4 h-4" />;
      case "DELIVERED":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const ActionCell = ({ row }: { row: any }) => {
    const isLoading = selectedOrder === row.original.id && loading;
    const currentStatus = row.original.status;

    const nextStatus = currentStatus === "PAID" ? "SHIPPED" : 
                      currentStatus === "SHIPPED" ? "DELIVERED" : null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center gap-2"
      >
        <div className="flex items-center gap-2">
          {isPaidSection && nextStatus && (
            <Button
              onClick={() => handleStatusChange(row.original.id, nextStatus)}
              disabled={isLoading}
              size="sm"
              className={cn(
                "flex items-center gap-2",
                "bg-blue-600 text-white hover:bg-blue-700",
                "dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700",
                "transition-colors duration-200"
              )}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                getStatusIcon(nextStatus)
              )}
              Mark as {nextStatus.toLowerCase()}
            </Button>
          )}
        </div>
        <Button
          onClick={() => {
            setOrderToDelete(row.original.id);
            setOpen(true);
          }}
          disabled={isLoading}
          size="sm"
          variant="destructive"
          className={cn(
            "flex items-center gap-2",
            "dark:bg-red-600 dark:hover:bg-red-700"
          )}
        >
          <Trash2 className="w-4 h-4" />
          Delete Order
        </Button>
      </motion.div>
    );
  };

  const updatedColumns = [
    ...columns,
    {
      id: "actions",
      cell: ({ row }: { row: any }) => <ActionCell row={row} />,
    },
  ];

  return (
    <>
      <AlertModal 
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        loading={loading}
      />
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="dark:bg-gray-900"
        >
          <DataTable 
            columns={updatedColumns} 
            data={localOrders}
            searchKey="products"
          />
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default OrdersClient;
