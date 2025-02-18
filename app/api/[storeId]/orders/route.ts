import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { format } from "date-fns";
import { formatter } from "@/lib/utils";

export async function GET(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const orders = await prismadb.order.findMany({
      where: {
        storeId: params.storeId,
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedOrders = orders.map((item) => ({
      id: item.id,
      phone: item.phone,
      address: item.address,
      city: item.city,
      country: item.country,
      postalCode: item.postalCode,
      email: item.customerEmail,
      paidProducts: item.orderItems
        .filter((orderItem) => item.isPaid)
        .map((orderItem) => orderItem.product.name)
        .join(", "),
      unpaidProducts: item.orderItems
        .filter((orderItem) => !item.isPaid)
        .map((orderItem) => orderItem.product.name)
        .join(", "),
      totalPrice: formatter.format(
        item.orderItems.reduce((total, orderItem) => {
          return total + Number(orderItem.product.price);
        }, 0)
      ),
      createdAt: format(item.createdAt, "MMMM do, yyyy"),
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("[ORDERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
