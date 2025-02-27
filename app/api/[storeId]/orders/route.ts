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
        OR: [
          { status: "PAID" },
          { status: "SHIPPED" },
          { status: "DELIVERED" },
          { AND: [
            { status: "CANCELLED" },
            { paymentIntentId: { not: null } }
          ]}
        ]
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true
              }
            },
            size: true,
            color: true
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
      totalPrice: item.amount.toString(),
      shippingDetails: {
        address: item.address,
        city: item.city,
        country: item.country,
        postalCode: item.phone
      },
      isPaid: item.isPaid,
      createdAt: item.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("[ORDERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { orderId, status, action } = await req.json();

    if (!orderId) {
      return new NextResponse("Order id is required", { status: 400 });
    }

    if (action === "remove") {
      // Delete the order
      const order = await prismadb.order.delete({
        where: {
          id: orderId
        }
      });
      return NextResponse.json(order);
    } else {
      // Update order status
      const order = await prismadb.order.update({
        where: {
          id: orderId
        },
        data: {
          status,
        }
      });
      return NextResponse.json(order);
    }
  } catch (error) {
    console.error("[ORDER_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
