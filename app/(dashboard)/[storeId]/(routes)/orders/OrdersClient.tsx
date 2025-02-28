"use client";

import { useState, useEffect } from "react";
import { OrderColumn } from "./components/columns";
import { OrderCard } from "./components/OrderCard";
import { OrderSearch } from "./components/OrderSearch";
import { toast } from "react-hot-toast";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { AlertModal } from "@/components/modals/alert-modal";

interface OrdersClientProps {
  orders: OrderColumn[];
  storeId: string;
  currentStatus: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";
}

const OrdersClient: React.FC<OrdersClientProps> = ({
  orders: initialOrders,
  storeId,
  currentStatus
}) => {
  const [filteredOrders, setFilteredOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // Setup SSE for real-time updates
  useEffect(() => {
    const eventSource = new EventSource(`/api/${storeId}/orders/events`);

    eventSource.onmessage = (event) => {
      const updatedOrder = JSON.parse(event.data);
      setFilteredOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
        )
      );
    };

    return () => {
      eventSource.close();
    };
  }, [storeId]);

  // Update filtered orders when initial orders change
  useEffect(() => {
    setFilteredOrders(initialOrders);
  }, [initialOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setLoading(true);
      setSelectedOrder(orderId);

      await axios.patch(`/api/${storeId}/orders/${orderId}`, {
        status: newStatus
      });

      setFilteredOrders(prevOrders => 
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

      setFilteredOrders(prevOrders => 
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

  const handleSearch = (searchResults: OrderColumn[]) => {
    setFilteredOrders(searchResults);
  };

  return (
    <>
      <AlertModal 
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        loading={loading}
      />

      <OrderSearch orders={initialOrders} onSearch={handleSearch} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="col-span-full text-center py-10"
            >
              <p className="text-gray-500 dark:text-gray-400">No orders found</p>
            </motion.div>
          ) : (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                onDelete={(id) => {
                  setOrderToDelete(id);
                  setOpen(true);
                }}
                loading={loading}
                selectedOrder={selectedOrder}
                currentStatus={currentStatus}
                storeId={storeId}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default OrdersClient;
