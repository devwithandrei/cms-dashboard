import Stripe from "stripe";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

export async function POST(req: Request) {
  const { productIds, sizes, colors, quantities, customerDetails } = await req.json();

  if (!productIds || productIds.length === 0) {
    return new NextResponse("Product ids are required", { status: 400 });
  }

  if (!customerDetails) {
    return new NextResponse("Customer details are required", { status: 400 });
  }

  try {
    const products = await prismadb.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    const totalPrice = productIds.reduce((total: number, productId: string, index: number) => {
      const product = products.find((p) => p.id === productId);

      if (!product) {
        throw new Error(`Product with id ${productId} not found`);
      }

      return total + (product.price.toNumber() * quantities[index] * 100); // Convert price to cents
    }, 0);

    const order = await prismadb.order.create({
      data: {
        storeId: "your-store-id", // Replace with actual store ID
        isPaid: false,
        orderItems: {
          create: productIds.map((productId: string, index: number) => ({
            product: {
              connect: {
                id: productId,
              },
            },
            sizeId: sizes[index],
            colorId: colors[index],
            quantity: quantities[index],
          })),
        },
        phone: customerDetails.phone,
        address: `${customerDetails.cardholderName}, ${customerDetails.country}, ${customerDetails.zip}`,
        city: customerDetails.city,
        country: customerDetails.country,
        customerName: customerDetails.cardholderName,
        customerEmail: customerDetails.email,
        postalCode: customerDetails.zip,
      },
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPrice,
      currency: 'eur',
      metadata: {
        orderId: order.id,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.log("[CREATE_PAYMENT_INTENT_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
