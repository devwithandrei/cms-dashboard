"use client";

import { CreditCard, DollarSign, Package } from "lucide-react";

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Overview } from "@/components/overview";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface DashboardContentProps {
  totalRevenue: number;
  graphRevenue: any[];
  salesCount: number;
  stockCount: number;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  totalRevenue,
  graphRevenue,
  salesCount,
  stockCount,
}) => {
  const cards = [
    {
      title: "Total Revenue",
      icon: DollarSign,
      content: formatCurrency(totalRevenue),
      helperText: "Total revenue from all orders"
    },
    {
      title: "Products in Stock",
      icon: Package,
      content: stockCount.toString(),
      helperText: "Total products currently in stock"
    },
    {
      title: "Total Orders",
      icon: CreditCard,
      content: salesCount.toString(),
      helperText: "Total number of orders"
    }
  ];

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading title="Dashboard" description="Overview of your store" />
        <Separator className="dark:bg-gray-700" />
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {cards.map((card) => (
            <Card 
              key={card.title} 
              className={cn(
                "hover:shadow-lg transition-shadow",
                "dark:bg-gray-800 dark:border-gray-700"
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium dark:text-white">
                  {card.title}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold dark:text-white">
                  {card.content}
                </div>
                <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                  {card.helperText}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className={cn(
          "col-span-4",
          "dark:bg-gray-800 dark:border-gray-700"
        )}>
          <CardHeader>
            <CardTitle className="dark:text-white">Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={graphRevenue} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardContent;
