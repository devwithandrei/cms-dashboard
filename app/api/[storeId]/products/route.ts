import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import prismadb from '@/lib/prismadb';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Replace with your frontend domain
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { userId } = auth();

    const body = await req.json();

    const { name, price, categoryId, colorId, sizeId, brandId, descriptionId, images, isFeatured, isArchived } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403, headers: corsHeaders });
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400, headers: corsHeaders });
    }

    if (!images || !images.length) {
      return new NextResponse("Images are required", { status: 400, headers: corsHeaders });
    }

    if (!price) {
      return new NextResponse("Price is required", { status: 400, headers: corsHeaders });
    }

    if (!categoryId) {
      return new NextResponse("Category id is required", { status: 400, headers: corsHeaders });
    }

    if (!colorId) {
      return new NextResponse("Color id is required", { status: 400, headers: corsHeaders });
    }

    if (!sizeId) {
      return new NextResponse("Size id is required", { status: 400, headers: corsHeaders });
    }

    if (!brandId) {
      return new NextResponse("Brand id is required", { status: 400, headers: corsHeaders });
    }

    if (!descriptionId) {
      return new NextResponse("Description id is required", { status: 400, headers: corsHeaders });
    }

    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400, headers: corsHeaders });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId
      }
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 405, headers: corsHeaders });
    }

    const product = await prismadb.product.create({
      data: {
        name,
        price,
        isFeatured,
        isArchived,
        categoryId,
        colorId,
        sizeId,
        brandId,
        descriptionId,
        storeId: params.storeId,
        images: {
          createMany: {
            data: [
              ...images.map((image: { url: string }) => image),
            ],
          },
        },
      },
    });
  
    return new NextResponse(JSON.stringify(product), { headers: corsHeaders });
  } catch (error) {
    console.log('[PRODUCTS_POST]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
};

export async function GET(
  req: Request,
  { params }: { params: { storeId: string } },
) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId') || undefined;
    const colorId = searchParams.get('colorId') || undefined;
    const sizeId = searchParams.get('sizeId') || undefined;
    const brandId = searchParams.get('brandId') || undefined;
    const descriptionId = searchParams.get('descriptionId') || undefined;
    const isFeatured = searchParams.get('isFeatured');

    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400, headers: corsHeaders });
    }

    const products = await prismadb.product.findMany({
      where: {
        storeId: params.storeId,
        categoryId,
        colorId,
        sizeId,
        brandId,
        descriptionId,
        isFeatured: isFeatured ? true : undefined,
        isArchived: false,
      },
      include: {
        images: true,
        category: true,
        color: true,
        size: true,
        brand: true,
        description: true,
      },
      orderBy: {
        createdAt: 'desc',
      }
    });
  
    return new NextResponse(JSON.stringify(products), { headers: corsHeaders });
  } catch (error) {
    console.log('[PRODUCTS_GET]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}