import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata?.orderId;

    const order = await prismadb.order.update({
      where: {
        id: orderId,
      },
      data: {
        isPaid: true,
        status: 'processing'
      },
    });

    // Update stock for each order item
    const orderItems = await prismadb.orderItem.findMany({
      where: {
        orderId: orderId,
      },
      include: {
        product: true,
      },
    });

    for (const orderItem of orderItems) {
      try {
        const product = await prismadb.product.findUnique({
          where: {
            id: orderItem.productId,
          },
        });

        if (!product) {
          console.error(`Product with id ${orderItem.productId} not found`);
          continue;
        }

        if (product.stock === null) {
          console.error(`Product with id ${orderItem.productId} has null stock`);
          continue;
        }

        const newStock = product.stock - orderItem.quantity;

        await prismadb.product.update({
          where: {
            id: orderItem.productId,
          },
          data: {
            stock: newStock,
          },
        });

        console.log(`Updated stock for product ${orderItem.productId} to ${newStock}`);
      } catch (error: any) {
        console.error(`Error updating stock for product ${orderItem.productId}: ${error.message}`);
      }
    }
  }

  return new NextResponse(null, { status: 200 });
}
