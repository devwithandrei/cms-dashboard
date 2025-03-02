import prismadb, { withRetry } from "@/lib/prismadb";

// Add this to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const getStockCount = async (storeId: string) => {
  try {
    console.log(`Calculating stock count for store ${storeId}`);
    
    // Use a more efficient query that calculates the sum directly in the database
    // This is much faster than fetching all products and calculating in JavaScript
    const result = await withRetry(() => 
      prismadb.product.aggregate({
        where: {
          storeId,
          isArchived: false,
        },
        _sum: {
          stock: true
        }
      })
    );

    // Also get variation stock counts (product sizes and colors)
    const [sizeStockResult, colorStockResult] = await Promise.all([
      withRetry(() => 
        prismadb.productSize.aggregate({
          where: {
            product: {
              storeId,
              isArchived: false
            }
          },
          _sum: {
            stock: true
          }
        })
      ),
      withRetry(() => 
        prismadb.productColor.aggregate({
          where: {
            product: {
              storeId,
              isArchived: false
            }
          },
          _sum: {
            stock: true
          }
        })
      )
    ]);

    // Sum up all stocks (base product + variations)
    const baseStock = result._sum.stock || 0;
    const sizeStock = sizeStockResult._sum.stock || 0;
    const colorStock = colorStockResult._sum.stock || 0;
    const totalStock = baseStock + sizeStock + colorStock;
    
    // Log all stock counts for reference
    console.log(`Stock counts for store ${storeId}:`, {
      baseStock,
      sizeStock,
      colorStock,
      total: totalStock
    });
    
    // Return the total stock count (base + variations)
    return totalStock;
  } catch (error) {
    console.error("[GET_STOCK_COUNT_ERROR]", error);
    return 0;
  }
};
