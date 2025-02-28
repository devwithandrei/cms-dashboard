"use client";

import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Users, Search, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ApiList } from "@/components/ui/api-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { UserColumn, columns } from "./columns";

interface UsersClientProps {
  data: UserColumn[];
}

export const UsersClient: React.FC<UsersClientProps> = ({
  data
}) => {
  const router = useRouter();
  const params = useParams();

  // Calculate user statistics
  const activeUsers = data.filter(user => user.status === "active").length;
  const pendingUsers = data.filter(user => user.status === "pending").length;
  const totalOrders = data.reduce((sum, user) => sum + user.ordersCount, 0);
  const totalRevenue = data.reduce((sum, user) => sum + user.totalSpent, 0);
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR"
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <Heading
          title={`Users (${data.length})`}
          description="Manage users and view their information"
        />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              <Badge variant="outline" className="mr-1">{activeUsers} active</Badge>
              <Badge variant="outline">{pendingUsers} pending</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From all users
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime value
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Avg. Revenue</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.length > 0 ? totalRevenue / data.length : 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per user
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Separator />
      
      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-md shadow-sm p-4">
        <DataTable 
          searchKey={["email", "id", "firstName", "lastName"]} 
          searchPlaceholder="Search by email, ID, or name..."
          columns={columns} 
          data={data} 
        />
      </div>
      
      <Heading title="API" description="API calls for Users" />
      <Separator />
      <ApiList entityName="users" entityIdName="userId" />
    </div>
  );
};
