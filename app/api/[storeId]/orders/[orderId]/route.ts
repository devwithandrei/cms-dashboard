import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { Order, OrderStatus } from '@/types';
import prismadb from '@/lib/prismadb';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const validOrderStatuses = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELED
];

interface UpdateOrderRequest {
  status?: string;
  orderStatus?: string;
  trackingNumber?: string;
  tracking_number?: string;
  shippingMethod?: string;
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET(
  req: Request,
  { params }: { params: { orderId: string; storeId: string } }
) {
  try {
    if (!params.orderId) {
      return new NextResponse("Order id is required", { status: 400, headers: corsHeaders });
    }

    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400, headers: corsHeaders });
    }

    const order = await prismadb.order.findUnique({
      where: {
        id: params.orderId,
        storeId: params.storeId,
      },
      include: {
        orderItems: true,
      }
    });

    return new NextResponse(JSON.stringify(order), { headers: corsHeaders });
  } catch (error) {
    console.log('[ORDER_GET]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { orderId: string; storeId: string } }
) {
  try {
    if (!params.orderId) {
      return new NextResponse("Order id is required", { status: 400, headers: corsHeaders });
    }

    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400, headers: corsHeaders });
    }

    // First, delete the associated OrderItems
    await prismadb.orderItem.deleteMany({
      where: {
        orderId: params.orderId,
      },
    });

    // Then, delete the Order
    const order = await prismadb.order.delete({
      where: {
        id: params.orderId,
        storeId: params.storeId,
      },
    });

    return new NextResponse(JSON.stringify(order), { headers: corsHeaders });
  } catch (error) {
    console.log('[ORDER_DELETE]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { orderId: string; storeId: string } }
) {
  try {
    const body = await req.json() as UpdateOrderRequest;

    if (!params.orderId) {
      return new NextResponse("Order id is required", { status: 400, headers: corsHeaders });
    }

    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400, headers: corsHeaders });
    }

    // Handle different field names from different clients
    const newStatus = (body.status || body.orderStatus) as OrderStatus | undefined;
    const newTrackingNumber = body.trackingNumber || body.tracking_number;

    if (!newStatus || !validOrderStatuses.includes(newStatus)) {
      return new NextResponse("Valid status is required", { status: 400, headers: corsHeaders });
    }

    // First, get the current order to check if it exists
    const existingOrder = await prismadb.order.findUnique({
      where: {
        id: params.orderId,
        storeId: params.storeId,
      }
    });

    if (!existingOrder) {
      return new NextResponse("Order not found", { status: 404, headers: corsHeaders });
    }

    // Create a type-safe update data object
    const updateData = {
      status: newStatus,
      ...(newTrackingNumber ? {
        trackingNumber: newTrackingNumber,
        shippingMethod: 'tracked'
      } : {})
    } satisfies Partial<Pick<Order, 'status' | 'trackingNumber' | 'shippingMethod'>>;

    // Update the order with properly typed data
    const order = await prismadb.order.update({
      where: {
        id: params.orderId,
      },
      data: updateData,
      include: {
        orderItems: true
      }
    });

    return new NextResponse(JSON.stringify(order), { headers: corsHeaders });
  } catch (error) {
    console.log('[ORDER_PUT]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { storeId: string; orderId: string } }
) {
  try {
    const { status } = await req.json();

    if (!status) {
      return new NextResponse("Status is required", { status: 400, headers: corsHeaders });
    }

    // Validate that status is one of the allowed values
    if (!validOrderStatuses.includes(status as OrderStatus)) {
      return new NextResponse("Invalid status value", { status: 400, headers: corsHeaders });
    }

    const order = await prismadb.order.update({
      where: {
        id: params.orderId,
        storeId: params.storeId,
      },
      data: {
        status: status as OrderStatus,
      },
    });

    return new NextResponse(JSON.stringify(order), { headers: corsHeaders });
  } catch (error) {
    console.log('[ORDER_PATCH]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
}
