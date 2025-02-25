"use client";

import { useRouter } from "next/navigation";
import axios from 'axios';
import { toast } from "react-hot-toast";
import { OrderColumn } from "./components/columns";
import { format } from "date-fns";
import { useState } from "react";
import { OrderStatus } from "@prisma/client";
import { formatCurrency } from "@/lib/currency";

interface OrdersClientProps {
  orders: OrderColumn[];
  storeId: string;
}

const OrdersClient: React.FC<OrdersClientProps> = ({ orders, storeId }) => {
  const router = useRouter();
  const [orderData, setOrderData] = useState(orders);

  const deleteOrder = async (orderId: string) => {
    try {
      const response = await axios.delete(`/api/${storeId}/orders/${orderId}`);
      if (response.status === 200) {
        toast.success('Order deleted successfully');
        setOrderData(prevOrders => prevOrders.filter(order => order.id !== orderId));
      } else {
        toast.error(`Failed to delete order: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(`Failed to delete order: ${error.response?.status} ${error.response?.data}`);
      } else {
        toast.error(`Failed to delete order: ${error}`);
      }
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await axios.patch(`/api/${storeId}/orders/${orderId}`, {
        status: newStatus
      });
      
      if (response.status === 200) {
        toast.success(`Order status updated to ${newStatus}`);
        setOrderData(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      }
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const formatOrderItems = (order: OrderColumn) => {
    return order.products || "No items";
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-600";
      case "PAID":
        return "text-blue-600";
      case "SHIPPED":
        return "text-purple-600";
      case "DELIVERED":
        return "text-green-600";
      case "CANCELLED":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-black dark:text-white">Orders</h2>
      <div className="space-y-4">
        {orderData.map(order => (
          <div key={order.id} className="p-4 border rounded-lg shadow-md bg-white dark:bg-gray-800">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-black dark:text-white">Order ID: {order.id}</h3>
                <p className="text-black dark:text-white"><strong>User ID:</strong> {order.userId}</p>
                <p className="text-black dark:text-white"><strong>Name:</strong> {order.userName}</p>
                <p className="text-black dark:text-white"><strong>Email:</strong> {order.userEmail}</p>
                <p className="text-black dark:text-white"><strong>Phone:</strong> {order.phone}</p>
                <p className="text-black dark:text-white"><strong>Address:</strong> {order.address} {order.city && `, ${order.city}`} {order.country && `, ${order.country}`} {order.postalCode && `, ${order.postalCode}`}</p>
                <p className="text-black dark:text-white"><strong>Products:</strong> {formatOrderItems(order)}</p>
                <p className="text-black dark:text-white"><strong>Total Price:</strong> {formatCurrency(order.amount)}</p>
                <p className="text-black dark:text-white"><strong>Created At:</strong> {format(Date.parse(order.createdAt), 'MMMM dd, yyyy hh:mm a')}</p>
                <p className="text-black dark:text-white">
                  <strong>Status:</strong>
                  <span className={`ml-2 font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </p>
                {order.isPaid && (
                  <p className="text-green-600 font-semibold mt-2">
                    Payment Confirmed
                  </p>
                )}
              </div>
              <div className="flex flex-col space-y-2">
                <select
                  className="p-2 border rounded-md bg-white dark:bg-gray-700 text-black dark:text-white"
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <button
                  onClick={() => deleteOrder(order.id)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersClient;
