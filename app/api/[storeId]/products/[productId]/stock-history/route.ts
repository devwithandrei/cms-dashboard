import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";

import prismadb from "@/lib/prismadb";

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
        productId: params.productId
      },
      include: {
        size: true,
        color: true
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
