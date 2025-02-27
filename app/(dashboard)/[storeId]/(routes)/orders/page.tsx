import { format } from "date-fns";

import prismadb from "@/lib/prismadb";
import OrderClient from "./OrdersClient";
import { OrderColumn } from "./components/columns";
import { formatter } from "@/lib/utils";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const OrdersPage = async ({
  params
}: {
  params: { storeId: string }
}) => {
  const orders = await prismadb.order.findMany({
    where: {
      storeId: params.storeId,
    },
    include: {
      orderItems: {
        include: {
          product: true,
          size: true,
          color: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const formattedOrders: OrderColumn[] = orders.map((item) => ({
    id: item.id,
    phone: item.phone,
    address: item.address,
    products: item.orderItems.map((orderItem) => {
      const size = orderItem.size?.name || '';
      const color = orderItem.color?.name || '';
      const variations = [size, color].filter(Boolean).join(', ');
      return `${orderItem.product.name}${variations ? ` (${variations})` : ''}`;
    }).join(', '),
    totalPrice: formatter.format(item.amount.toNumber()),
    amount: item.amount.toNumber(),
    isPaid: item.isPaid,
    createdAt: item.createdAt.toISOString(),
    status: item.status,
    customerName: item.customerName,
    customerEmail: item.customerEmail,
    shippingDetails: {
      address: item.address,
      city: item.city,
      country: item.country,
      postalCode: item.postalCode,
      phone: item.phone,
    },
  }));

  const paidOrders = formattedOrders.filter(order => order.isPaid);
  const unpaidOrders = formattedOrders.filter(order => !order.isPaid);

  return (
    <div className="flex-col bg-white dark:bg-gray-900">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="dark:text-white">
          <Heading title="Orders" description="Manage your store orders" />
        </div>
        <Separator className="dark:bg-gray-700" />
        <Tabs defaultValue="paid" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger 
              value="paid"
              className={cn(
                "data-[state=active]:bg-blue-600 data-[state=active]:text-white",
                "dark:text-gray-300 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white",
                "transition-all duration-200"
              )}
            >
              Paid Orders
            </TabsTrigger>
            <TabsTrigger 
              value="unpaid"
              className={cn(
                "data-[state=active]:bg-blue-600 data-[state=active]:text-white",
                "dark:text-gray-300 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white",
                "transition-all duration-200"
              )}
            >
              Unpaid Orders
            </TabsTrigger>
          </TabsList>
          <TabsContent value="paid" className="space-y-4">
            <OrderClient 
              orders={paidOrders}
              storeId={params.storeId}
              isPaidSection={true}
            />
          </TabsContent>
          <TabsContent value="unpaid" className="space-y-4">
            <OrderClient 
              orders={unpaidOrders}
              storeId={params.storeId}
              isPaidSection={false}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OrdersPage;
