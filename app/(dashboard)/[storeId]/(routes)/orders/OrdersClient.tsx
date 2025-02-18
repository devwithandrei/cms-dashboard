"use client";

import { useRouter } from "next/navigation";
import axios from 'axios';
import { toast } from "react-hot-toast";
import { OrderColumn } from "./components/columns";
import { format } from "date-fns";
import { useState } from "react";

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

  return (
    <div className="flex bg-white dark:bg-gray-800">
      
      <div className="flex-1 p-4">
        <h2 className="text-xl font-bold text-black dark:text-white">Paid Orders</h2>
        <div className="flex flex-col space-y-4">
          {orderData.filter(order => order.paidProducts).map(order => (
            <div key={order.id} className="p-4 border rounded-lg shadow-md bg-green-100 dark:bg-green-700">
              <h3 className="text-lg font-bold text-black dark:text-white">Order ID: {order.id}</h3>
              <p className="text-black dark:text-white"><strong>Phone:</strong> {order.phone}</p>
              <p className="text-black dark:text-white"><strong>Address:</strong> {order.address}, {order.city}, {order.country}, {order.postalCode}</p>
              <p className="text-black dark:text-white"><strong>Email:</strong> {order.email}</p>
              <p className="text-black dark:text-white"><strong>Products:</strong> {order.paidProducts || "None"}</p>
              <p className="text-black dark:text-white"><strong>Total Price:</strong> {order.totalPrice}</p>
              <p className="text-black dark:text-white"><strong>Created At:</strong> {order.createdAt}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4">
        <h2 className="text-xl font-bold text-black dark:text-white">Unpaid Orders</h2>
        <div className="flex flex-col space-y-4">
          {orderData.map(order => (
            <div key={order.id} className="p-4 border rounded-lg shadow-md bg-red-100 dark:bg-red-700">
              <h3 className="text-lg font-bold text-black dark:text-white">Order ID: {order.id}</h3>
              <p className="text-black dark:text-white"><strong>Phone:</strong> {order.phone}</p>
              <p className="text-black dark:text-white"><strong>Address:</strong> {order.address}, {order.city}, {order.country}, {order.postalCode}</p>
              <p className="text-black dark:text-white"><strong>Email:</strong> {order.email}</p>
              <p className="text-black dark:text-white"><strong>Products:</strong> {order.unpaidProducts || "None"}</p>
              <p className="text-black dark:text-white"><strong>Total Price:</strong> {order.totalPrice}</p>
              <p className="text-black dark:text-white"><strong>Created At:</strong> {order.createdAt}</p>
              <button
                onClick={() => deleteOrder(order.id)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mt-2"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrdersClient;
