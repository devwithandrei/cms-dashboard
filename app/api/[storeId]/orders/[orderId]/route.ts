import { NextResponse } from 'next/server';
import { Prisma, OrderStatus } from '@prisma/client';
import prismadb from '@/lib/prismadb';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const validOrderStatuses = [
  'PENDING',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED'
] as const;

interface UpdateOrderRequest {
  status?: string;
  orderStatus?: string;
  trackingNumber?: string;
  tracking_number?: string;
  shippingMethod?: string;
}

const orderInclude = {
  orderItems: {
    include: {
      product: {
        include: {
          images: true,
          category: true,
          brand: true,
          productSizes: {
            include: {
              size: true
            }
          },
          productColors: {
            include: {
              color: true
            }
          }
        }
      }
    }
  },
  user: {
    select: {
      name: true,
      email: true,
    },
  },
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

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
      include: orderInclude
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
      },
      include: orderInclude
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
    } as const;

    // Update the order with properly typed data
    const order = await prismadb.order.update({
      where: {
        id: params.orderId,
      },
      data: {
        status: updateData.status,
        ...(updateData.trackingNumber && {
          trackingNumber: updateData.trackingNumber,
          shippingMethod: updateData.shippingMethod
        })
      },
      include: orderInclude
    });

    // If status changed to SHIPPED or DELIVERED, update stock
    if (updateData.status === 'SHIPPED' || updateData.status === 'DELIVERED') {
      // Update stock for each order item
      for (const item of existingOrder.orderItems) {
        const product = item.product;

        // If size and color selected, update variation stock
        if (item.sizeId && item.colorId) {
          const productSize = product.productSizes.find(ps => ps.sizeId === item.sizeId);
          const productColor = product.productColors.find(pc => pc.colorId === item.colorId);
          
          if (productSize) {
            await prismadb.productSize.update({
              where: { id: productSize.id },
              data: { stock: Math.max(0, productSize.stock - item.quantity) }
            });
          }
          
          if (productColor) {
            await prismadb.productColor.update({
              where: { id: productColor.id },
              data: { stock: Math.max(0, productColor.stock - item.quantity) }
            });
          }
        }
        // Otherwise update base product stock
        else if (product.stock !== null && product.stock !== undefined) {
          await prismadb.product.update({
            where: { id: item.productId },
            data: { stock: Math.max(0, product.stock - item.quantity) }
          });
        }

        // Create stock history entry
        await prismadb.stockHistory.create({
          data: {
            productId: item.productId,
            quantity: -item.quantity,
            type: 'OUT',
            reason: `Order ${order.id} ${updateData.status}`
          }
        });
      }
    }

    // If status changed to SHIPPED, send notification or perform other actions
    if (updateData.status === 'SHIPPED') {
      // Here you could add notification logic
      console.log(`Order ${order.id} has been shipped`);
    }

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
      include: orderInclude
    });

    return new NextResponse(JSON.stringify(order), { headers: corsHeaders });
  } catch (error) {
    console.log('[ORDER_PATCH]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
}
