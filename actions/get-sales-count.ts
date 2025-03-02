import prismadb, { withRetry } from "@/lib/prismadb";
import { OrderStatus } from "@prisma/client";

// Add this to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const getSalesCount = async (storeId: string) => {
  try {
    console.log(`Calculating sales count for store ${storeId}`);
    
    const salesCount = await withRetry(() => 
      prismadb.order.count({
        where: {
          storeId,
          status: {
            in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
          }
        },
      })
    );
    
    console.log(`Sales count for store ${storeId}: ${salesCount}`);
    return salesCount;
  } catch (error) {
    console.error("[GET_SALES_COUNT_ERROR]", error);
    return 0;
  }
};
