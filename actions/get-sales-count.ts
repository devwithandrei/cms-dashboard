import prismadb from "@/lib/prismadb";
import { OrderStatus } from "@/types";

export const getSalesCount = async (storeId: string) => {
  const salesCount = await prismadb.order.count({
    where: {
      storeId,
      status: {
        in: ['PAID', 'DELIVERED'] as OrderStatus[]
      }
    },
  });

  return salesCount;
};
