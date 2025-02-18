"use client";
import { useRouter } from "next/navigation";
import useSWR from 'swr';
import { OrderColumn } from "./components/columns";
import OrdersClient from "./OrdersClient";
import { useParams } from "next/navigation";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const OrdersPage = () => {
  const params = useParams();
  const storeId = params?.storeId as string;
  const router = useRouter();
  const { data: orders, error, isLoading } = useSWR<OrderColumn[], Error>(storeId ? `/api/${storeId}/orders` : null, fetcher);

  if (!storeId) {
    return <div>Store ID not found</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading orders</div>;
  }

  return (
    <div className="flex bg-white dark:bg-gray-800">
      <OrdersClient orders={orders || []} storeId={storeId} />
    </div>
  );
};


export default OrdersPage;
