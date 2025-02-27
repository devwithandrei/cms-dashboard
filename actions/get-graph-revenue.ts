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

export const getGraphRevenue = async (storeId: string): Promise<GraphData[]> => {
  const paidOrders = await prismadb.order.findMany({
    where: {
      storeId,
      isPaid: true,
    },
    include: {
      orderItems: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const monthlyRevenue: { [key: string]: { total: number; orderCount: number; orders: any[] } } = {};

  // Group orders by month and year
  for (const order of paidOrders) {
    const date = new Date(order.createdAt);
    const monthYear = `${date.getFullYear()}-${date.getMonth()}`;

    const revenueForOrder = order.orderItems.reduce((total, item) => {
      return total + (item.product.price.toNumber() * item.quantity);
    }, 0);

    if (!monthlyRevenue[monthYear]) {
      monthlyRevenue[monthYear] = {
        total: 0,
        orderCount: 0,
        orders: []
      };
    }

    monthlyRevenue[monthYear].total += revenueForOrder;
    monthlyRevenue[monthYear].orderCount += 1;
    monthlyRevenue[monthYear].orders.push({
      ...order,
      total: revenueForOrder
    });
  }

  // Create array of last 12 months
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date;
  }).reverse();

  const formattedData: GraphData[] = last12Months.map((date) => {
    const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
    const monthData = monthlyRevenue[monthYear] || { total: 0, orderCount: 0, orders: [] };

    // Get daily data for this month
    const dailyData = Array.from({ length: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() }, (_, day) => {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), day + 1);
      const dayOrders = monthData.orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getDate() === currentDate.getDate();
      });

      const dayTotal = dayOrders.reduce((sum, order) => sum + order.total, 0);
      const dayOrderCount = dayOrders.length;

      // Create hourly data
      const hourlyData = Array.from({ length: 24 }, (_, hour) => {
        const hourOrders = dayOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.getHours() === hour;
        });

        return {
          hour,
          total: hourOrders.reduce((sum, order) => sum + order.total, 0),
          orderCount: hourOrders.length
        };
      });

      return {
        date: currentDate,
        total: dayTotal,
        orderCount: dayOrderCount,
        hourlyData
      };
    });

    return {
      name: date.toLocaleString('default', { month: 'short' }),
      total: monthData.total,
      orderCount: monthData.orderCount,
      averageOrderValue: monthData.orderCount > 0 ? monthData.total / monthData.orderCount : 0,
      dailyData,
      createdAt: date
    };
  });

  return formattedData;
};
