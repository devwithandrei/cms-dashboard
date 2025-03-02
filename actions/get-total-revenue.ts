import prismadb, { withRetry } from "@/lib/prismadb";
import { OrderStatus } from "@prisma/client";

// Add this to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const getTotalRevenue = async (storeId: string) => {
  try {
    console.log(`Calculating total revenue for store ${storeId}`);
    
    // Use a more efficient query that calculates the sum directly in the database
    // This is much faster than fetching all orders and calculating in JavaScript
    const result = await withRetry(() => 
      prismadb.order.aggregate({
        where: {
          storeId,
          status: {
            in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
          }
        },
        _sum: {
          amount: true
        }
      })
    );

    const totalRevenue = result._sum.amount?.toNumber() || 0;
    
    console.log(`Total revenue for store ${storeId}: ${totalRevenue}`);
    return totalRevenue;
  } catch (error) {
    console.error("[GET_TOTAL_REVENUE_ERROR]", error);
    return 0;
  }
};
