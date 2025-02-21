import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { OrderStatus } from "@/types";

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
    const customerDetails = paymentIntent.metadata?.customerDetails 
      ? JSON.parse(paymentIntent.metadata.customerDetails)
      : null;
    const items = paymentIntent.metadata?.items 
      ? JSON.parse(paymentIntent.metadata.items)
      : [];

    try {
      // Create order
      const order = await prismadb.order.create({
        data: {
          storeId: process.env.STORE_ID!, // Make sure to set this in your environment
          status: 'PAID' as OrderStatus,
          phone: customerDetails?.phone || '',
          address: customerDetails?.address || '',
          customerEmail: customerDetails?.email || '',
          customerName: customerDetails?.name || '',
          city: customerDetails?.city || '',
          country: customerDetails?.country || '',
          postalCode: customerDetails?.postalCode || '',
          orderItems: {
            create: items.map((item: any) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
              sizeId: item.size || null,
              colorId: item.color || null,
            }))
          }
        },
      });

      // Update product stock
      for (const item of items) {
        const product = await prismadb.product.findUnique({
          where: { id: item.id }
        });

        if (product && typeof product.stock === 'number') {
          await prismadb.product.update({
            where: { id: item.id },
            data: {
              stock: Math.max(0, product.stock - (item.quantity || 1))
            }
          });
        }
      }

      return new NextResponse(JSON.stringify({ orderId: order.id }), { status: 200 });
    } catch (error) {
      console.error('Error processing order:', error);
      return new NextResponse('Error processing order', { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}
