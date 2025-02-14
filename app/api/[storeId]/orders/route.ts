import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import prismadb from '@/lib/prismadb';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const body = await req.json();

    const { 
      orderItems,
      customerName,
      customerEmail,
      phone,
      address,
      city,
      postalCode,
      country,
      shippingMethod
    } = body;

    if (!orderItems || !orderItems.length) {
      return new NextResponse("Order items are required", { status: 400, headers: corsHeaders });
    }

    if (!customerName) {
      return new NextResponse("Customer name is required", { status: 400, headers: corsHeaders });
    }

    if (!customerEmail) {
      return new NextResponse("Customer email is required", { status: 400, headers: corsHeaders });
    }

    if (!phone) {
      return new NextResponse("Phone number is required", { status: 400, headers: corsHeaders });
    }

    if (!address) {
      return new NextResponse("Address is required", { status: 400, headers: corsHeaders });
    }

    if (!city) {
      return new NextResponse("City is required", { status: 400, headers: corsHeaders });
    }

    if (!postalCode) {
      return new NextResponse("Postal code is required", { status: 400, headers: corsHeaders });
    }

    if (!country) {
      return new NextResponse("Country is required", { status: 400, headers: corsHeaders });
    }

    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400, headers: corsHeaders });
    }

    // Create the order with customer information
    const order = await prismadb.order.create({
      data: {
        storeId: params.storeId,
        customerName,
        customerEmail,
        phone,
        address,
        city,
        postalCode,
        country,
        shippingMethod,
        status: 'pending',
        orderItems: {
          create: orderItems.map((item: any) => ({
            productId: item.productId,
            sizeId: item.sizeId,
            colorId: item.colorId,
            quantity: item.quantity,
            price: item.price,
          }))
        }
      },
      include: {
        orderItems: {
          include: {
            product: true,
            size: true,
            color: true,
          }
        }
      }
    });

    return new NextResponse(JSON.stringify(order), { headers: corsHeaders });
  } catch (error) {
    console.log('[ORDERS_POST]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400, headers: corsHeaders });
    }

    const orders = await prismadb.order.findMany({
      where: {
        storeId: params.storeId,
        status: status || undefined,
      },
      include: {
        orderItems: {
          include: {
            product: true,
            size: true,
            color: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return new NextResponse(JSON.stringify(orders), { headers: corsHeaders });
  } catch (error) {
    console.log('[ORDERS_GET]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}
