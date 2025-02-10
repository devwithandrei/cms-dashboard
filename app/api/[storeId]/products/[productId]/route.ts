import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import prismadb from "@/lib/prismadb";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://your-frontend-domain.com', // Replace with your frontend domain
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    if (!params.productId) {
      return new NextResponse("Product id is required", { status: 400, headers: corsHeaders });
    }

    const product = await prismadb.product.findUnique({
      where: {
        id: params.productId
      },
      include: {
        images: true,
        category: true,
        size: true,
        brand: true,
        description: true,
        color: true,
      }
    });
  
    return new NextResponse(JSON.stringify(product), { headers: corsHeaders });
  } catch (error) {
    console.log('[PRODUCT_GET]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
};

export async function DELETE(
  req: Request,
  { params }: { params: { productId: string, storeId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403, headers: corsHeaders });
    }

    if (!params.productId) {
      return new NextResponse("Product id is required", { status: 400, headers: corsHeaders });
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

    const product = await prismadb.product.delete({
      where: {
        id: params.productId
      },
    });
  
    return new NextResponse(JSON.stringify(product), { headers: corsHeaders });
  } catch (error) {
    console.log('[PRODUCT_DELETE]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
};

export async function PATCH(
  req: Request,
  { params }: { params: { productId: string, storeId: string } }
) {
  try {
    const { userId } = auth();

    const body = await req.json();

    const { name, price, categoryId, images, colorId, sizeId, brandId, descriptionId, isFeatured, isArchived } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403, headers: corsHeaders });
    }

    if (!params.productId) {
      return new NextResponse("Product id is required", { status: 400, headers: corsHeaders });
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

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId
      }
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 405, headers: corsHeaders });
    }

    await prismadb.product.update({
      where: {
        id: params.productId
      },
      data: {
        name,
        price,
        categoryId,
        colorId,
        sizeId,
        brandId,
        descriptionId,
        images: {
          deleteMany: {},
        },
        isFeatured,
        isArchived,
      },
    });

    const product = await prismadb.product.update({
      where: {
        id: params.productId
      },
      data: {
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
    console.log('[PRODUCT_PATCH]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}