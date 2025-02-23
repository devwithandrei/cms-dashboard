import prismadb from "@/lib/prismadb";
import { OrderStatus, Order } from "@prisma/client";

export const getTotalRevenue = async (storeId: string) => {
  const paidOrders = await prismadb.order.findMany({
    where: {
      storeId,
      status: {
        in: [OrderStatus.PAID, OrderStatus.DELIVERED]
      }
    },
    include: {
      orderItems: {
        include: {
          product: true
        }
      }
    }
  });

  const totalRevenue = paidOrders.reduce((total: number, order: Order) => {
    return total + (order.amount?.toNumber() || 0);
  }, 0);

  return totalRevenue;
};
