import Stripe from "stripe";
import { NextResponse } from "next/server";
import { OrderStatus } from "@/types";
import prismadb from "@/lib/prismadb";
import { Decimal } from "@prisma/client/runtime/library";

interface ProductWithPrice {
  id: string;
  price: Decimal;
  name: string;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { productIds, sizes, colors, quantities, customerDetails } = await req.json();

    if (!productIds || productIds.length === 0) {
      return new NextResponse("Product ids are required", { status: 400 });
    }

    if (!customerDetails) {
      return new NextResponse("Customer details are required", { status: 400 });
    }

    const products = await prismadb.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        price: true,
        name: true
      }
    });

    const totalAmount = productIds.reduce((total: number, productId: string, index: number) => {
      const product = products.find((p: ProductWithPrice) => p.id === productId);
      if (!product) {
        throw new Error(`Product with id ${productId} not found`);
      }
      return total + (product.price.toNumber() * quantities[index]);
    }, 0);

    // Create order first
    const order = await prismadb.order.create({
      data: {
        storeId: params.storeId,
        status: OrderStatus.PENDING,
        amount: totalAmount,
        customerName: customerDetails.name || '',
        customerEmail: customerDetails.email || '',
        phone: customerDetails.phone || '',
        address: customerDetails.address || '',
        city: customerDetails.city || '',
        country: customerDetails.country || '',
        postalCode: customerDetails.postalCode || '',
        orderItems: {
          create: productIds.map((productId: string, index: number) => {
            const product = products.find((p: ProductWithPrice) => p.id === productId);
            if (!product) throw new Error(`Product with id ${productId} not found`);
            
            const orderItem = {
              product: {
                connect: {
                  id: productId
                }
              },
              quantity: quantities[index],
              price: product.price
            } as const;

            if (sizes?.[index]) {
              return {
                ...orderItem,
                size: {
                  connect: {
                    id: sizes[index]
                  }
                }
              };
            }

            if (colors?.[index]) {
              return {
                ...orderItem,
                color: {
                  connect: {
                    id: colors[index]
                  }
                }
              };
            }

            return orderItem;
          })
        }
      }
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'usd',
      metadata: {
        orderId: order.id,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret }, {
      headers: corsHeaders
    });
  } catch (error) {
    console.log('[PAYMENT_INTENT_ERROR]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
