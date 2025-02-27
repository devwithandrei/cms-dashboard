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
    
    // Get daily data from database
    const dailyData = await Promise.all(
      Array.from({ length: daysInMonth }, async (_, day) => {
        const dayNumber = day + 1;
        const startOfDay = new Date(year, month - 1, dayNumber, 0, 0, 0);
        const endOfDay = new Date(year, month - 1, dayNumber, 23, 59, 59);
        
        // Get daily totals
        const dailyTotals = await prismadb.order.aggregate({
          where: {
            storeId,
            isPaid: true,
            createdAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          },
          _sum: {
            amount: true
          },
          _count: {
            id: true
          }
        });
        
        // Get hourly data
        const hourlyData = await Promise.all(
          Array.from({ length: 24 }, async (_, hour) => {
            const startOfHour = new Date(year, month - 1, dayNumber, hour, 0, 0);
            const endOfHour = new Date(year, month - 1, dayNumber, hour, 59, 59);
            
            const hourlyTotals = await prismadb.order.aggregate({
              where: {
                storeId,
                isPaid: true,
                createdAt: {
                  gte: startOfHour,
                  lte: endOfHour
                }
              },
              _sum: {
                amount: true
              },
              _count: {
                id: true
              }
            });
            
            return {
              hour,
              total: hourlyTotals._sum.amount?.toNumber() || 0,
              orderCount: hourlyTotals._count.id || 0
            };
          })
        );
        
        return {
          date: startOfDay,
          total: dailyTotals._sum.amount?.toNumber() || 0,
          orderCount: dailyTotals._count.id || 0,
          hourlyData
        };
      })
    );
    
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
};
