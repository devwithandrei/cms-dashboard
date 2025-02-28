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
  try {
    // Calculate date range for last 12 months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // Get monthly aggregated data directly from the database
    const monthlyData = await prismadb.$queryRaw<
      Array<{ month: number; year: number; total: number; orderCount: number }>
    >`
      SELECT 
        MONTH(createdAt) as month, 
        YEAR(createdAt) as year, 
        SUM(amount) as total, 
        COUNT(*) as orderCount
      FROM \`Order\`
      WHERE 
        storeId = ${storeId} 
        AND isPaid = true
        AND createdAt >= ${startDate}
        AND createdAt <= ${endDate}
      GROUP BY YEAR(createdAt), MONTH(createdAt)
      ORDER BY YEAR(createdAt), MONTH(createdAt)
    `;

    // Create array of last 12 months
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date;
    }).reverse();

    // Create a map for quick lookup of monthly data
    const monthDataMap = new Map();
    monthlyData.forEach(data => {
      const key = `${data.year}-${data.month}`;
      monthDataMap.set(key, {
        total: Number(data.total),
        orderCount: Number(data.orderCount)
      });
    });

    // Process each month
    const formattedData: GraphData[] = await Promise.all(last12Months.map(async (date) => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // SQL months are 1-12
      const key = `${year}-${month}`;
      
      // Get data for this month from our map, or use defaults
      const monthData = monthDataMap.get(key) || { total: 0, orderCount: 0 };
      
      // Get daily data for this month
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // Get daily data from database in a single query
      const dailyDataRaw = await prismadb.$queryRaw<
        Array<{ day: number; hour: number; total: number; orderCount: number }>
      >`
        SELECT 
          DAY(createdAt) as day,
          HOUR(createdAt) as hour, 
          SUM(amount) as total, 
          COUNT(*) as orderCount
        FROM \`Order\`
        WHERE 
          storeId = ${storeId} 
          AND isPaid = true
          AND MONTH(createdAt) = ${month}
          AND YEAR(createdAt) = ${year}
        GROUP BY DAY(createdAt), HOUR(createdAt)
        ORDER BY DAY(createdAt), HOUR(createdAt)
      `;
      
      // Create a map for quick lookup of daily/hourly data
      const dailyHourlyDataMap = new Map();
      dailyDataRaw.forEach(data => {
        const key = `${data.day}-${data.hour}`;
        dailyHourlyDataMap.set(key, {
          total: Number(data.total),
          orderCount: Number(data.orderCount)
        });
      });
      
      // Process daily data
      const dailyData = Array.from({ length: daysInMonth }, (_, dayIndex) => {
        const day = dayIndex + 1;
        const startOfDay = new Date(year, month - 1, day);
        
        // Aggregate hourly data for this day
        let dayTotal = 0;
        let dayOrderCount = 0;
        const hourlyData = Array.from({ length: 24 }, (_, hour) => {
          const key = `${day}-${hour}`;
          const hourData = dailyHourlyDataMap.get(key) || { total: 0, orderCount: 0 };
          
          dayTotal += hourData.total;
          dayOrderCount += hourData.orderCount;
          
          return {
            hour,
            total: hourData.total,
            orderCount: hourData.orderCount
          };
        });
        
        return {
          date: startOfDay,
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
    }));

    return formattedData;
  } catch (error: any) {
    console.error("[GET_GRAPH_REVENUE]", error);
    return [];
  }
};
