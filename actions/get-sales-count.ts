import prismadb from "@/lib/prismadb";
import { OrderStatus } from "@prisma/client";

export const getSalesCount = async (storeId: string) => {
  const salesCount = await prismadb.order.count({
    where: {
      storeId,
      status: {
        in: [OrderStatus.PAID, OrderStatus.DELIVERED]
      }
    },
  });

  return salesCount;
};
