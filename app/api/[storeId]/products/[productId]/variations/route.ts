import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";

import prismadb from "@/lib/prismadb";

export async function PATCH(
  req: Request,
  { params }: { params: { storeId: string; productId: string } }
) {
  try {
    const { userId } = auth();
    const body = await req.json();

    const { variations, reason, changeType } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403 });
    }

    if (!variations || !reason || !changeType) {
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

    // Get current variations
    const [currentSizeVariations, currentColorVariations] = await Promise.all([
      prismadb.productSize.findMany({
        where: {
          productId: params.productId
        },
        include: {
          size: true
        }
      }),
      prismadb.productColor.findMany({
        where: {
          productId: params.productId
        },
        include: {
          color: true
        }
      })
    ]);

    // Create stock history entries and update variations
    const updatePromises = variations.map(async (variation: any) => {
      const sizeVariation = currentSizeVariations.find(v => v.id === variation.id);
      const colorVariation = currentColorVariations.find(v => v.id === variation.id);
      
      if (!sizeVariation && !colorVariation) {
        throw new Error(`Variation ${variation.id} not found`);
      }

      // Create stock history entry based on variation type
      if (sizeVariation) {
        // Create stock history entry
        const stockHistoryData = {
          productId: params.productId,
          oldStock: sizeVariation.stock,
          newStock: variation.stock,
          reason,
          changeType,
          quantity: variation.stock - sizeVariation.stock, // Calculate quantity change
          type: changeType === 'increase' ? 'IN' : 'OUT', // Determine type
          sizeId: sizeVariation.sizeId,
          colorId: undefined,
          createdBy: userId,
        };
        await prismadb.stockHistory.create({
          data: stockHistoryData
        });

        // Update size variation stock
        return prismadb.productSize.update({
          where: { id: variation.id },
          data: { stock: variation.stock }
        });
      } else if (colorVariation) {
        // Create stock history entry
        const stockHistoryData = {
          productId: params.productId,
          oldStock: colorVariation.stock,
          newStock: variation.stock,
          reason,
          changeType,
          quantity: variation.stock - colorVariation.stock, // Calculate quantity change
          type: changeType === 'increase' ? 'IN' : 'OUT', // Determine type
          sizeId: undefined,
          colorId: colorVariation.colorId,
          createdBy: userId,
        };
        await prismadb.stockHistory.create({
          data: stockHistoryData
        });

        // Update color variation stock
        return prismadb.productColor.update({
          where: { id: variation.id },
          data: { stock: variation.stock }
        });
      }
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.log('[PRODUCT_VARIATIONS_PATCH]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
