"use client";

import { useState } from "react";
import { OrderStatus } from "@/types";

interface OrderStatusCellProps {
  initialStatus: OrderStatus;
  orderId: string;
  storeId: string;
}

export const OrderStatusCell = ({
  initialStatus,
  orderId,
  storeId,
}: OrderStatusCellProps) => {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  const statusColors: Record<OrderStatus, string> = {
    'PENDING': 'text-yellow-600',
    'PAID': 'text-blue-600',
    'DELIVERED': 'text-green-600',
    'CANCELED': 'text-red-600',
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/${storeId}/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setStatus(newStatus);
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
        disabled={isLoading}
        className={`
          font-medium p-2 rounded-md border
          ${statusColors[status]}
          disabled:opacity-50
          transition-colors
        `}
      >
        <option value="PENDING">Pending</option>
        <option value="PAID">Paid</option>
        <option value="DELIVERED">Delivered</option>
        <option value="CANCELED">Canceled</option>
      </select>
    </div>
  );
};
