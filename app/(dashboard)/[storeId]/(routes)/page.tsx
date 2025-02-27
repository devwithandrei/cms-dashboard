import { CreditCard, DollarSign, Package } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { Overview } from "@/components/overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { getTotalRevenue } from "@/actions/get-total-revenue";
import { getSalesCount } from "@/actions/get-sales-count";
import { getStockCount } from "@/actions/get-stock-count";
import { getGraphRevenue } from "@/actions/get-graph-revenue";
import { formatter } from "@/lib/utils";
import prismadb from "@/lib/prismadb";

interface DashboardPageProps {
  params: {
    storeId: string;
  };
}

const DashboardPage: React.FC<DashboardPageProps> = async ({ params }) => {
  const totalRevenue = await getTotalRevenue(params.storeId);
  const graphRevenue = await getGraphRevenue(params.storeId);
  const salesCount = await getSalesCount(params.storeId);
  const stockCount = await getStockCount(params.storeId);

  const store = await prismadb.store.findFirst({
    where: {
      id: params.storeId,
    }
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Heading title={store?.name || "Store"} description="Store dashboard overview" />
        <Separator />
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card className="bg-[#0a101f]/50 backdrop-blur-sm border-gray-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                {formatter.format(totalRevenue)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0a101f]/50 backdrop-blur-sm border-gray-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Sales
              </CardTitle>
              <CreditCard className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                +{salesCount}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0a101f]/50 backdrop-blur-sm border-gray-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Products In Stock
              </CardTitle>
              <Package className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                {stockCount}
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="bg-[#0a101f]/50 backdrop-blur-sm border-gray-800/50">
          <CardHeader>
            <CardTitle className="text-gray-400">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Overview data={graphRevenue} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
