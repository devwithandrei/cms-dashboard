"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserColumn } from "./columns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar,
  CreditCard,
  Heart,
  Mail,
  ShoppingBag,
  User,
  Copy,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface UserDetailsModalProps {
  isOpen: boolean;
  onCloseAction: () => Promise<void>;
  user: UserColumn;
}

const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return "Not available";
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return "Not available";
    }
    return format(date, "MMMM d, yyyy");
  } catch (error) {
    console.error('Error formatting date:', error);
    return "Not available";
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(amount);
};

export function UserDetailsModal({
  isOpen,
  onCloseAction,
  user,
}: UserDetailsModalProps) {
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.email.split("@")[0];
    
  const onCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard.`);
  };
  
  // Calculate user metrics
  const avgOrderValue = user.ordersCount > 0 
    ? user.totalSpent / user.ordersCount 
    : 0;
  
  // Determine user status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500 text-white";
      case "pending": return "bg-yellow-500 text-white";
      case "inactive": return "bg-gray-500 text-white";
      default: return "bg-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onCloseAction()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">User Profile</DialogTitle>
          <DialogDescription>
            Detailed information about the user
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 pt-4">
            {/* User Header */}
            <div className="flex flex-col md:flex-row md:items-center gap-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <Avatar className="h-20 w-20 mx-auto md:mx-0">
                <AvatarImage src={user.imageUrl || undefined} />
                <AvatarFallback className="text-lg">
                  {displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 text-center md:text-left">
                <h2 className="text-2xl font-bold">{displayName}</h2>
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge 
                    className={getStatusColor(user.status)}
                  >
                    {user.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>
              <div className="ml-auto flex-shrink-0 hidden md:block">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onCopy(user.id, "User ID")}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy ID
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Orders
                  </CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.ordersCount || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lifetime orders
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Spent
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(user.totalSpent || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lifetime value
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg. Order
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(avgOrderValue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Per order
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Wishlist Items
                  </CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {user.wishlistCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Saved products
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Activity Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Account Created</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>

                {user.lastOrderDate && (
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                      <ShoppingBag className="h-5 w-5 text-green-600 dark:text-green-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last Purchase</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(user.lastOrderDate)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6 pt-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">User Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate max-w-[200px]" title={user.id}>{user.id}</p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => onCopy(user.id, "User ID")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.email}</p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => onCopy(user.email, "Email")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">First Name</p>
                    <p className="font-medium">{user.firstName || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Name</p>
                    <p className="font-medium">{user.lastName || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Account Status</h3>
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${getStatusColor(user.status)}`}>
                  {user.status === "active" ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : user.status === "pending" ? (
                    <Clock className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium capitalize">{user.status}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.status === "active" 
                      ? "User has completed registration and is active" 
                      : user.status === "pending" 
                        ? "User has started registration but not completed it"
                        : "User account is inactive"}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6 pt-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Order History</h3>
              {user.ordersCount > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Total Orders</p>
                      <p className="text-sm text-muted-foreground">
                        {user.ordersCount} orders placed
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Total Spent</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(user.totalSpent)}
                      </p>
                    </div>
                  </div>
                  
                  {user.lastOrderDate && (
                    <div>
                      <p className="font-medium">Last Order</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(user.lastOrderDate)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No orders placed yet</p>
              )}
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-4">Wishlist</h3>
              {user.wishlistCount > 0 ? (
                <div>
                  <p className="font-medium">{user.wishlistCount} items in wishlist</p>
                  <p className="text-sm text-muted-foreground">
                    User has saved {user.wishlistCount} products to their wishlist
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No items in wishlist</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            User ID: {user.id}
          </div>
          <Button onClick={() => onCloseAction()}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
