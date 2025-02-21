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

    const formattedOrders = orders.map((item: any) => ({
      id: item.id,
      phone: item.customerDetails?.phone || '',
      address: item.customerDetails?.address || '',
      city: item.customerDetails?.city || '',
      country: item.customerDetails?.country || '',
      postalCode: item.customerDetails?.postalCode || '',
      email: item.customerDetails?.email || '',
      status: item.status,
      products: item.orderItems
        .map((orderItem: any) => orderItem.product.name)
        .join(", "),
      totalPrice: formatter.format(
        item.orderItems.reduce((total: number, orderItem: any) => {
          return total + (Number(orderItem.price) * orderItem.quantity);
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
