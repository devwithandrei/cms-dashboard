import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";

// Add this to prevent caching
export const dynamic = 'force-dynamic';

export async function DELETE(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    if (!params.orderId) {
      return new NextResponse("Order id is required", { status: 400 });
    }

    // Delete order items first due to foreign key constraint
    await prismadb.orderItem.deleteMany({
      where: {
        orderId: params.orderId
      }
    });

    // Then delete the order
    const order = await prismadb.order.delete({
      where: {
        id: params.orderId
      }
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("[ORDER_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { status } = await req.json();

    if (!params.orderId) {
      return new NextResponse("Order id is required", { status: 400 });
    }

    const order = await prismadb.order.update({
      where: {
        id: params.orderId
      },
      data: {
        status,
      }
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("[ORDER_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
