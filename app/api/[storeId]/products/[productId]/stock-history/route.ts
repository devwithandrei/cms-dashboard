import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";

import prismadb from "@/lib/prismadb";

// Add this to prevent caching
export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { storeId: string; productId: string } }
) {
  try {
    const { userId } = auth();
    const body = await req.json();

    const { newStock, reason, changeType } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403 });
    }

    if (typeof newStock !== 'number' || !reason || !changeType) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const store = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      }
    });

    if (!store) {
      return new NextResponse("Unauthorized", { status: 405 });
    }

    // Get current product
    const product = await prismadb.product.findUnique({
      where: {
        id: params.productId
      }
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    // Get current stock
    const currentStock = product.stock || 0;

    // Calculate quantity
    const quantity = newStock - currentStock;

    // Create stock history entry
    const stockHistoryEntry = await prismadb.stockHistory.create({
      data: {
        productId: params.productId,
        quantity,
        type: changeType === 'increase' ? 'IN' : 'OUT',
        reason,
        oldStock: currentStock,
        newStock,
        createdAt: new Date(),
      },
    });

    // Update product stock
    const updatedProduct = await prismadb.product.update({
      where: { id: params.productId },
      data: { stock: newStock }
    });

    return NextResponse.json({ stockHistoryEntry, updatedProduct });
  } catch (error) {
    console.log('[STOCK_HISTORY_POST]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { storeId: string; productId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403 });
    }

    const store = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      }
    });

    if (!store) {
      return new NextResponse("Unauthorized", { status: 405 });
    }

    const stockHistory = await prismadb.stockHistory.findMany({
      where: {
        productId: params.productId,
      },
      include: {
        // Only include properties that are valid in StockHistoryInclude
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(stockHistory);
  } catch (error) {
    console.log('[STOCK_HISTORY_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
