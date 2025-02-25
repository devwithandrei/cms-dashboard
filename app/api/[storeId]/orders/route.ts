import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/currency";

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
      phone: item.phone || '',
      address: item.address || '',
      city: item.city || '',
      country: item.country || '',
      postalCode: item.postalCode || '',
      email: item.customerEmail || '',
      customerName: item.customerName || '',
      userId: item.userId,
      userEmail: item.customerEmail,
      userName: item.customerName,
      status: item.status,
      products: item.orderItems
        .map((orderItem: any) => orderItem.product.name)
        .join(", "),
      amount: formatCurrency(item.amount),
      isPaid: item.isPaid,
      createdAt: item.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("[ORDERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
