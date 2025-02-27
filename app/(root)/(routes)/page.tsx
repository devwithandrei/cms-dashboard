import { CreditCard, DollarSign, Package } from "lucide-react";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { Overview } from "@/components/overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { getTotalRevenue } from "@/actions/get-total-revenue";
import { getSalesCount } from "@/actions/get-sales-count";
import { getGraphRevenue } from "@/actions/get-graph-revenue";
import { getStockCount } from "@/actions/get-stock-count";
import { formatter } from "@/lib/utils";
import prismadb from "@/lib/prismadb";

interface GraphData {
  name: string;
  total: number;
  orderCount: number;
  averageOrderValue: number;
  dailyData: {
    date: Date;
    total: number;
    orderCount: number;
    hourlyData: {
      hour: number;
      total: number;
      orderCount: number;
    }[];
  }[];
  createdAt: Date;
}

const DashboardPage = async () => {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const store = await prismadb.store.findFirst({
    where: {
      userId
    }
  });

  if (!store) {
    redirect('/');
  }

  const totalRevenue = await getTotalRevenue(store.id);
  const graphRevenue = await getGraphRevenue(store.id);
  const salesCount = await getSalesCount(store.id);
  const stockCount = await getStockCount(store.id);

  const mergedGraphData: GraphData[] = graphRevenue.map((item) => ({
    name: new Date(item.createdAt).toLocaleString('default', { month: 'short' }),
    total: item.total,
    orderCount: item.orderCount,
    averageOrderValue: item.orderCount > 0 ? item.total / item.orderCount : 0,
    dailyData: item.dailyData || [],
    createdAt: new Date(item.createdAt)
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading title="Dashboard" description="Overview of your store" />
        <Separator />
        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatter.format(totalRevenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{salesCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products In Stock</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockCount}</div>
            </CardContent>
          </Card>
        </div>
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Overview data={mergedGraphData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
