import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import prismadb from "@/lib/prismadb";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  req: Request,
  { params }: { params: { productId: string; storeId: string } }
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
        brand: true,
        description: true,
        productSizes: {
          include: {
            size: true
          }
        },
        productColors: {
          include: {
            color: true
          }
        }
      }
    });

    // Transform the response to maintain backward compatibility
    const transformedProduct = product ? {
      ...product,
      sizes: product.productSizes.map(ps => ({
        id: ps.sizeId,
        name: ps.size.name,
        value: ps.size.value,
        stock: ps.stock
      })),
      colors: product.productColors.map(pc => ({
        id: pc.colorId,
        name: pc.color.name,
        value: pc.color.value,
        stock: pc.stock
      })),
      productSizes: undefined,
      productColors: undefined
    } : null;

    return NextResponse.json(transformedProduct, { headers: corsHeaders });
  } catch (error) {
    console.log('[PRODUCT_GET]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { productId: string; storeId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    console.log('Received update body:', body);

    const {
      name,
      price,
      categoryId,
      brandId,
      descriptionId,
      images,
      sizes = [],
      colors = [],
      stock,
      isFeatured,
      isArchived,
    } = body;

    if (!params.productId) {
      return new NextResponse("Product id is required", { status: 400, headers: corsHeaders });
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400, headers: corsHeaders });
    }

    if (!price) {
      return new NextResponse("Price is required", { status: 400, headers: corsHeaders });
    }

    if (!categoryId) {
      return new NextResponse("Category id is required", { status: 400, headers: corsHeaders });
    }

    if (!brandId) {
      return new NextResponse("Brand id is required", { status: 400, headers: corsHeaders });
    }

    if (!images || !images.length) {
      return new NextResponse("Images are required", { status: 400, headers: corsHeaders });
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

    console.log('Updating product with sizes:', sizes);
    console.log('Updating product with colors:', colors);

    // First delete existing relationships
    await prismadb.$transaction([
      prismadb.productSize.deleteMany({
        where: { productId: params.productId }
      }),
      prismadb.productColor.deleteMany({
        where: { productId: params.productId }
      })
    ]);

    // Then update the product and create new relationships
    const product = await prismadb.product.update({
      where: {
        id: params.productId
      },
      data: {
        name,
        price,
        stock: stock || 0,
        categoryId,
        brandId,
        descriptionId,
        images: {
          deleteMany: {},
          createMany: {
            data: images.map((image: { url: string }) => image),
          },
        },
        productSizes: {
          createMany: {
            data: sizes.map((size: { sizeId: string }) => ({
              sizeId: size.sizeId,
              stock: 0
            }))
          }
        },
        productColors: {
          createMany: {
            data: colors.map((color: { colorId: string }) => ({
              colorId: color.colorId,
              stock: 0
            }))
          }
        },
        isFeatured,
        isArchived,
      },
      include: {
        images: true,
        category: true,
        brand: true,
        description: true,
        productSizes: {
          include: {
            size: true
          }
        },
        productColors: {
          include: {
            color: true
          }
        }
      }
    });

    console.log('Updated product:', product);
    return NextResponse.json(product, { headers: corsHeaders });
  } catch (error) {
    console.log('[PRODUCT_PATCH]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
};

export async function DELETE(
  req: Request,
  { params }: { params: { productId: string; storeId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401, headers: corsHeaders });
    }

    if (!params.productId) {
      return new NextResponse("Product ID is required", { status: 400, headers: corsHeaders });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId
      }
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403, headers: corsHeaders });
    }

    const product = await prismadb.product.delete({
      where: {
        id: params.productId
      }
    });

    return NextResponse.json(product, { headers: corsHeaders });
  } catch (error) {
    console.error('[PRODUCT_DELETE]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
}
