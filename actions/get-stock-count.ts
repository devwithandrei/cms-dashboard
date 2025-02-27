import prismadb from "@/lib/prismadb";

export const getStockCount = async (storeId: string) => {
  const products = await prismadb.product.findMany({
    where: {
      storeId,
      isArchived: false,
    },
    select: {
      stock: true
    }
  });

  // Sum up all base product stocks
  const totalStock = products.reduce((sum, product) => sum + (product.stock || 0), 0);

  return totalStock;
};
