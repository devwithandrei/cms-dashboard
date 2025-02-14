import Stripe from "stripe"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { stripe } from "@/lib/stripe"
import prismadb from "@/lib/prismadb"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get("Stripe-Signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const address = session?.customer_details?.address;

  const addressComponents = [
    address?.line1,
    address?.line2,
    address?.city,
    address?.state,
    address?.postal_code,
    address?.country
  ];

  const addressString = addressComponents.filter((c) => c !== null).join(', ');

  if (event.type === "checkout.session.completed") {
    // First get the order
    const order = await prismadb.order.findUnique({
      where: {
        id: session?.metadata?.orderId,
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                productSizes: true,
                productColors: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Update order status
    await prismadb.order.update({
      where: {
        id: order.id
      },
      data: {
        isPaid: true,
        address: addressString,
        phone: session?.customer_details?.phone || '',
        status: 'processing'
      }
    });

    // Update stock for each order item
    for (const orderItem of order.orderItems) {
      // Update size stock if it exists
      if (orderItem.sizeId) {
        await prismadb.productSize.updateMany({
          where: {
            productId: orderItem.productId,
            sizeId: orderItem.sizeId
          },
          data: {
            stock: {
              decrement: orderItem.quantity
            }
          }
        });
      }

      // Update color stock if it exists
      if (orderItem.colorId) {
        await prismadb.productColor.updateMany({
          where: {
            productId: orderItem.productId,
            colorId: orderItem.colorId
          },
          data: {
            stock: {
              decrement: orderItem.quantity
            }
          }
        });
      }

      // Get current stock levels for history
      const [currentSize, currentColor] = await Promise.all([
        orderItem.sizeId ? prismadb.productSize.findFirst({
          where: {
            productId: orderItem.productId,
            sizeId: orderItem.sizeId
          }
        }) : null,
        orderItem.colorId ? prismadb.productColor.findFirst({
          where: {
            productId: orderItem.productId,
            colorId: orderItem.colorId
          }
        }) : null
      ]);

      const currentStock = currentSize?.stock ?? currentColor?.stock ?? 0;

      // Create stock history entry
      await prismadb.stockHistory.create({
        data: {
          productId: orderItem.productId,
          oldStock: currentStock,
          newStock: Math.max(0, currentStock - orderItem.quantity),
          reason: `Order #${order.id}`,
          changeType: 'order',
          sizeId: orderItem.sizeId,
          colorId: orderItem.colorId,
          createdBy: 'system'
        }
      });
    }
  }

  return new NextResponse(null, { status: 200 });
}
