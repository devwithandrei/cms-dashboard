import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import prismadb from "@/lib/prismadb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

interface Variation {
  sizeId?: string;
  colorId?: string;
}

interface VariationsMap {
  [key: string]: Variation;
}

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

  if (event.type === "payment_intent.created") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    try {
      // Check if order already exists
      const existingOrder = await prismadb.order.findFirst({
        where: { paymentIntentId: paymentIntent.id }
      });
      if (existingOrder) {
        return new NextResponse(JSON.stringify({ success: true }), { status: 200 });
      }

      const { userId, storeId, items, customerInfo, variations } = paymentIntent.metadata;
      const parsedItems = JSON.parse(items);
      const parsedCustomerInfo = JSON.parse(customerInfo);
      const parsedVariations = JSON.parse(variations);

      // Create order in PENDING state
      const order = await prismadb.order.create({
        data: {
          userId,
          storeId,
          amount: Math.round(paymentIntent.amount / 100),
          status: OrderStatus.PENDING,
          isPaid: false,
          paymentIntentId: paymentIntent.id,
          customerName: parsedCustomerInfo.name,
          customerEmail: parsedCustomerInfo.email,
          phone: parsedCustomerInfo.phone,
          address: parsedCustomerInfo.address,
          city: parsedCustomerInfo.city,
          country: parsedCustomerInfo.country,
          postalCode: parsedCustomerInfo.postalCode,
          orderItems: {
            create: parsedItems.map((item: any) => ({
              productId: item.id,
              quantity: item.quantity,
              sizeId: parsedVariations[item.id]?.sizeId,
              colorId: parsedVariations[item.id]?.colorId,
              price: Math.round(Number(item.price))
            }))
          }
        }
      });

      return new NextResponse(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
      console.error("Error creating order:", error);
      return new NextResponse("Error creating order", { status: 500 });
    }
  }

  if (event.type === "payment_intent.payment_failed" || event.type === "payment_intent.canceled") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    try {
      const order = await prismadb.order.findFirst({
        where: { paymentIntentId: paymentIntent.id }
      });

      if (order) {
        await prismadb.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELLED,
            isPaid: false
          }
        });
      }

      return new NextResponse(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
      console.error("Error updating order:", error);
      return new NextResponse("Error updating order", { status: 500 });
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = charge.payment_intent as string;

    if (paymentIntentId) {
      const order = await prismadb.order.findFirst({
        where: { paymentIntentId }
      });

      if (order) {
        await prismadb.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELLED,
            isPaid: false
          }
        });
      }
    }
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    try {
      const order = await prismadb.order.findFirst({
        where: { paymentIntentId: paymentIntent.id },
        include: { orderItems: true }
      });

      if (!order) {
        return new NextResponse("Order not found", { status: 404 });
      }

      // Get variations from metadata
      let variations: VariationsMap = {};
      try {
        if (paymentIntent.metadata?.variations) {
          variations = JSON.parse(paymentIntent.metadata.variations);
        }
      } catch (error) {
        console.error('Error parsing variations:', error);
        // Continue with empty variations object
      }

      // Use transaction to ensure data consistency
      await prismadb.$transaction(async (tx) => {
        // Update order status
        await tx.order.update({
          where: { id: order.id },
          data: { 
            status: OrderStatus.PAID,
            isPaid: true
          }
        });

        // Process each order item
        for (const item of order.orderItems) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            include: {
              productSizes: {
                include: { size: true }
              },
              productColors: {
                include: { color: true }
              }
            }
          });

          if (!product) continue;

          const variation = variations[item.productId];

          // Update size variation stock if selected
          if (variation?.sizeId) {
            const productSize = product.productSizes.find(ps => ps.sizeId === variation.sizeId);
            if (productSize) {
              await tx.productSize.update({
                where: { id: productSize.id },
                data: { stock: Math.max(0, productSize.stock - item.quantity) }
              });
            }
          }

          // Update color variation stock if selected
          if (variation?.colorId) {
            const productColor = product.productColors.find(pc => pc.colorId === variation.colorId);
            if (productColor) {
              await tx.productColor.update({
                where: { id: productColor.id },
                data: { stock: Math.max(0, productColor.stock - item.quantity) }
              });
            }
          }

          // If no variations or variations not found, update base product stock
          if ((!variation?.sizeId && !variation?.colorId) || 
              (variation?.sizeId && !product.productSizes.find(ps => ps.sizeId === variation.sizeId)) ||
              (variation?.colorId && !product.productColors.find(pc => pc.colorId === variation.colorId))) {
            if (product.stock !== null && product.stock !== undefined) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: Math.max(0, product.stock - item.quantity) }
              });
            }
          }

          // Create stock history entry with variation details
          await tx.stockHistory.create({
            data: {
              productId: item.productId,
              quantity: -item.quantity,
              type: 'OUT',
              reason: `Order ${order.id}${
                variation?.sizeId ? ` (Size: ${product.productSizes.find(ps => ps.sizeId === variation.sizeId)?.size.name})` : ''
              }${
                variation?.colorId ? ` (Color: ${product.productColors.find(pc => pc.colorId === variation.colorId)?.color.name})` : ''
              }`
            }
          });
        }
      });

      return new NextResponse(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
      console.error('Error processing payment:', error);
      return new NextResponse('Error processing payment', { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}
