import { format } from "date-fns";
import { Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import prismadb from "@/lib/prismadb";
import OrderClient from "./OrdersClient";
import { OrderColumn } from "./components/columns";
import { formatter } from "@/lib/utils";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const OrdersPage = async ({
  params,
  searchParams
}: {
  params: { storeId: string },
  searchParams: { [key: string]: string | string[] | undefined }
}) => {
  // Get pagination parameters from URL or use defaults
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const pageSize = 50; // Reasonable page size for orders
  const skip = (page - 1) * pageSize;

  // Get order counts by status for statistics
  const orderStatusCounts = await prismadb.order.groupBy({
    by: ['status'],
    where: {
      storeId: params.storeId,
    },
    _count: {
      id: true
    }
  });

  // Calculate total revenue
  const revenueResult = await prismadb.order.aggregate({
    where: {
      storeId: params.storeId,
      isPaid: true
    },
    _sum: {
      amount: true
    }
  });

  // Get paginated orders with optimized includes
  const orders = await prismadb.order.findMany({
    where: {
      storeId: params.storeId,
    },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true
            }
          },
          size: {
            select: {
              id: true,
              name: true
            }
          },
          color: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: pageSize,
    skip: skip
  });

  // Get total count for pagination
  const totalOrders = await prismadb.order.count({
    where: {
      storeId: params.storeId,
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

  const paidOrders = formattedOrders.filter(order => order.status === "PAID");
  const shippedOrders = formattedOrders.filter(order => order.status === "SHIPPED");
  const deliveredOrders = formattedOrders.filter(order => order.status === "DELIVERED");
  const canceledOrders = formattedOrders.filter(order => order.status === "CANCELLED");

  // Calculate order statistics
  const totalRevenue = revenueResult._sum.amount?.toNumber() || 0;
  const statusCounts = orderStatusCounts.reduce((acc, item) => {
    acc[item.status] = item._count.id;
    return acc;
  }, {} as Record<string, number>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-500";
      case "PAID": return "bg-blue-500";
      case "SHIPPED": return "bg-purple-500";
      case "DELIVERED": return "bg-green-500";
      case "CANCELLED": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING": return <Clock className="w-6 h-6" />;
      case "PAID": return <Package className="w-6 h-6" />;
      case "SHIPPED": return <Truck className="w-6 h-6" />;
      case "DELIVERED": return <CheckCircle className="w-6 h-6" />;
      case "CANCELLED": return <XCircle className="w-6 h-6" />;
      default: return null;
    }
  };

  return (
    <div className="flex-col bg-white dark:bg-gray-900">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="dark:text-white">
            <Heading title="Orders" description="Manage your store orders" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
            <Card className="p-4 flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <h3 className="text-lg font-semibold">Total Orders</h3>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </Card>
            <Card className="p-4 flex flex-col items-center justify-center bg-gradient-to-br from-green-500 to-green-600 text-white">
              <h3 className="text-lg font-semibold">Revenue</h3>
              <p className="text-2xl font-bold">{formatter.format(totalRevenue)}</p>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Card key={status} className={cn("p-4 flex items-center justify-between text-white", getStatusColor(status))}>
              <div className="flex items-center gap-2">
                {getStatusIcon(status)}
                <div>
                  <p className="text-sm font-medium">{status}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Separator className="dark:bg-gray-700" />
        
        <Tabs defaultValue="paid" className="space-y-4">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger 
              value="paid"
              className={cn(
                "data-[state=active]:bg-blue-600 data-[state=active]:text-white",
                "dark:text-gray-300 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white",
                "transition-all duration-200"
              )}
            >
              Paid ({paidOrders.length})
            </TabsTrigger>
            <TabsTrigger 
              value="shipped"
              className={cn(
                "data-[state=active]:bg-purple-600 data-[state=active]:text-white",
                "dark:text-gray-300 dark:data-[state=active]:bg-purple-600 dark:data-[state=active]:text-white",
                "transition-all duration-200"
              )}
            >
              Shipped ({shippedOrders.length})
            </TabsTrigger>
            <TabsTrigger 
              value="delivered"
              className={cn(
                "data-[state=active]:bg-green-600 data-[state=active]:text-white",
                "dark:text-gray-300 dark:data-[state=active]:bg-green-600 dark:data-[state=active]:text-white",
                "transition-all duration-200"
              )}
            >
              Delivered ({deliveredOrders.length})
            </TabsTrigger>
            <TabsTrigger 
              value="canceled"
              className={cn(
                "data-[state=active]:bg-red-600 data-[state=active]:text-white",
                "dark:text-gray-300 dark:data-[state=active]:bg-red-600 dark:data-[state=active]:text-white",
                "transition-all duration-200"
              )}
            >
              Canceled ({canceledOrders.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="paid" className="space-y-4">
            <OrderClient 
              orders={paidOrders}
              storeId={params.storeId}
              currentStatus="PAID"
            />
          </TabsContent>
          <TabsContent value="shipped" className="space-y-4">
            <OrderClient 
              orders={shippedOrders}
              storeId={params.storeId}
              currentStatus="SHIPPED"
            />
          </TabsContent>
          <TabsContent value="delivered" className="space-y-4">
            <OrderClient 
              orders={deliveredOrders}
              storeId={params.storeId}
              currentStatus="DELIVERED"
            />
          </TabsContent>
          <TabsContent value="canceled" className="space-y-4">
            <OrderClient 
              orders={canceledOrders}
              storeId={params.storeId}
              currentStatus="CANCELLED"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OrdersPage;
