import { Decimal } from "@prisma/client/runtime/library";

export interface ChartData {
  name: string;
  total: number;
  orderCount: number;
  averageOrderValue?: number;
}

export interface HourlyData {
  hour: number;
  total: number;
  orderCount: number;
}

export interface DailyData {
  date: Date;
  total: number;
  orderCount: number;
  hourlyData: HourlyData[];
}

export interface MonthData {
  name: string;
  total: number;
  orderCount: number;
  averageOrderValue: number;
  dailyData: DailyData[];
  createdAt: Date;
}

export interface Stats {
  max: number;
  min: number;
  avg: number;
  growth: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: Decimal;
  product: {
    id: string;
    name: string;
    price: Decimal;
  };
}

export interface Order {
  id: string;
  storeId: string;
  isPaid: boolean;
  amount: Decimal;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  orderItems: OrderItem[];
}

export interface GraphData {
  name: string;
  total: number;
  orderCount: number;
  averageOrderValue?: number;
  dailyData?: {
    date: Date;
    total: number;
    orderCount: number;
    hourlyData: {
      hour: number;
      total: number;
      orderCount: number;
    }[];
  }[];
}

export interface RevenueData {
  total: number;
  orderCount: number;
  orders: Order[];
}

export interface MonthlyRevenue {
  [key: string]: RevenueData;
}
