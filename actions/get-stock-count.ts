import prismadb from "@/lib/prismadb";

interface ProductSize {
  stock: number;
}

interface ProductColor {
  stock: number;
}

interface Product {
  id: string;
  stock: number | null;
  productSizes: ProductSize[];
  productColors: ProductColor[];
}

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

  // Sum up all base product stocks, matching how it's shown in the product list
  const totalStock = products.reduce((sum, product) => sum + (product.stock || 0), 0);

  return totalStock;
};
