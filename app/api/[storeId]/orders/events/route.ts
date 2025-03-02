import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prismadb from "@/lib/prismadb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const storeId = params.storeId;

    // Set up SSE headers
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'text/event-stream');
    responseHeaders.set('Cache-Control', 'no-cache');
    responseHeaders.set('Connection', 'keep-alive');

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Function to send order updates
    const sendUpdate = async () => {
      try {
        const orders = await prismadb.order.findMany({
          where: {
            storeId: storeId,
          },
          include: {
            orderItems: {
              include: {
                product: true,
                size: true,
                color: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        const formattedOrders = orders.map(order => ({
          id: order.id,
          status: order.status,
          isPaid: order.isPaid,
          phone: order.phone,
          address: order.address,
          products: order.orderItems.map(item => {
            const size = item.size?.name || '';
            const color = item.color?.name || '';
            const variations = [size, color].filter(Boolean).join(', ');
            return `${item.product.name}${variations ? ` (${variations})` : ''}`;
          }).join(', '),
          amount: order.amount,
          createdAt: order.createdAt.toISOString(),
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          shippingDetails: {
            address: order.address,
            city: order.city,
            country: order.country,
            postalCode: order.postalCode,
            phone: order.phone,
          },
        }));

        const data = `data: ${JSON.stringify(formattedOrders)}\n\n`;
        await writer.write(encoder.encode(data));
      } catch (error) {
        console.error('Error sending update:', error);
      }
    };

    // Send initial data
    await sendUpdate();

    // Set up interval for periodic updates
    const interval = setInterval(sendUpdate, 5000);

    // Clean up on disconnect
    req.signal.addEventListener('abort', () => {
      clearInterval(interval);
      writer.close();
    });

    return new Response(stream.readable, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[ORDERS_EVENTS]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
