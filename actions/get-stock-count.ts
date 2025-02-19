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
    include: {
      productSizes: {
        select: {
          stock: true,
        },
      },
      productColors: {
        select: {
          stock: true,
        },
      },
    },
  });

  let totalStock = 0;

  for (const product of products as unknown as Product[]) {
    if (product.productSizes.length === 0 && product.productColors.length === 0) {
      // If product has no variations, use its base stock
      totalStock += product.stock || 0;
    } else if (product.productSizes.length > 0 && product.productColors.length === 0) {
      // If product has only sizes
      totalStock += product.productSizes.reduce((sum: number, size: ProductSize) => sum + size.stock, 0);
    } else if (product.productSizes.length === 0 && product.productColors.length > 0) {
      // If product has only colors
      totalStock += product.productColors.reduce((sum: number, color: ProductColor) => sum + color.stock, 0);
    } else {
      // If product has both sizes and colors, use size stock as it represents the actual inventory
      totalStock += product.productSizes.reduce((sum: number, size: ProductSize) => sum + size.stock, 0);
    }
  }

  return totalStock;
};
