import prismadb, { withRetry } from "@/lib/prismadb";
import { format, subDays, addDays, isSameDay, startOfDay, endOfDay } from "date-fns";

interface GraphData {
  name: string;
  total: number;
  orderCount: number;
  averageOrderValue: number;
  growth: number; // Growth percentage compared to previous period
  trend: 'up' | 'down' | 'stable'; // Trend indicator
  date: Date; // Store the actual date for sorting and reference
}

export const getGraphRevenue = async (storeId: string): Promise<GraphData[]> => {
  try {
    // First, get the store creation date
    const store = await withRetry(() => 
      prismadb.store.findUnique({
        where: { id: storeId },
        select: { createdAt: true }
      })
    );

    if (!store) {
      throw new Error(`Store with ID ${storeId} not found`);
    }

    // Use the store creation date as the start date to get all historical data
    const startDate = new Date(store.createdAt);
    startDate.setHours(0, 0, 0, 0);
    
    // Use current date as end date
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    console.log(`Fetching daily revenue data from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Get daily aggregated data directly from the database
    const dailyData = await withRetry(() => 
      prismadb.$queryRaw<
        Array<{ date: Date; total: number; orderCount: number }>
      >`
        SELECT 
          DATE_TRUNC('day', "createdAt") as date,
          SUM(amount) as total, 
          COUNT(*) as "orderCount"
        FROM "Order"
        WHERE 
          "storeId" = ${storeId} 
          AND "isPaid" = true
          AND "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY DATE_TRUNC('day', "createdAt")
      `
    );

    console.log(`Found ${dailyData.length} days with revenue data`);

    // Create array of all days in the range
    const dayCount = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const allDays = Array.from({ length: dayCount }, (_, i) => {
      return addDays(new Date(startDate), i);
    });

    // Create a map for quick lookup of daily data
    const dayDataMap = new Map();
    dailyData.forEach(data => {
      const date = new Date(data.date);
      const key = format(date, 'yyyy-MM-dd');
      dayDataMap.set(key, {
        total: Number(data.total) || 0,
        orderCount: Number(data.orderCount) || 0
      });
    });

    // Process each day with real business metrics
    const formattedData: GraphData[] = allDays.map((date, index) => {
      const key = format(date, 'yyyy-MM-dd');
      
      // Get data for this day from our map, or use zero values
      let dayData = dayDataMap.get(key);
      
      if (!dayData) {
        // Use zero values for days without data
        dayData = { total: 0, orderCount: 0 };
      }

      // Calculate average order value (AOV)
      const averageOrderValue =
        dayData.orderCount > 0 ? dayData.total / dayData.orderCount : 0;

      // Calculate growth metrics (compared to previous day)
      let growth = 0;
      let trend: "up" | "down" | "stable" = "stable";

      if (index > 0) {
        const prevDate = subDays(date, 1);
        const prevKey = format(prevDate, "yyyy-MM-dd");
        const prevDayData = dayDataMap.get(prevKey) || { total: 0 };

        // Calculate day-over-day growth percentage
        if (prevDayData.total > 0) {
          growth =
            ((dayData.total - prevDayData.total) / prevDayData.total) * 100;
        } else if (dayData.total > 0) {
          growth = 100; // If previous day was 0 and current is positive, 100% growth
        }

        // Determine trend
        if (growth > 5) {
          trend = "up";
        } else if (growth < -5) {
          trend = "down";
        } else {
          trend = "stable";
        }
      }

      // Format the date as "MMM dd" for display (e.g., "Feb 23")
      const formattedDate = format(date, "MMM dd");

      return {
        name: formattedDate,
        total: dayData.total,
        orderCount: dayData.orderCount,
        averageOrderValue,
        growth: parseFloat(growth.toFixed(2)),
        trend,
        date: new Date(date), // Store the actual date for reference
      };
    });
    return formattedData
  } catch (error: any) {
    console.error("[GET_GRAPH_REVENUE]", error);
    return [];
  }
};
