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
    
    // Log authentication details for debugging
    console.log('Auth details:', { userId, headers: req.headers });
    
    if (!userId) {
      return new NextResponse("Unauthenticated", { 
        status: 401,
        headers: {
          ...corsHeaders,
          'WWW-Authenticate': 'Bearer'
        }
      });
    }

    const body = await req.json();
    
    const { 
      name,
      price,
      categoryId,
      brandId,
      descriptionId,
      images,
      isFeatured,
      isArchived,
      variations,
      stock
    } = body;

    if (!params.productId) {
      return new NextResponse("Product ID is required", { status: 400, headers: corsHeaders });
    }

    // Validate the request
    if (!name || !price || !categoryId || !brandId || !images?.length) {
      return new NextResponse("Missing required fields", { status: 400, headers: corsHeaders });
    }

    if (!variations?.length && typeof stock !== 'number') {
      return new NextResponse("Base stock is required for products without variations", { status: 400, headers: corsHeaders });
    }

    // Check if the user has access to this store
    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId
      }
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403, headers: corsHeaders });
    }

    // Update the product with transaction to ensure data consistency
    const product = await prismadb.$transaction(async (tx) => {
      // Delete existing variations
      await Promise.all([
        tx.productSize.deleteMany({
          where: { productId: params.productId }
        }),
        tx.productColor.deleteMany({
          where: { productId: params.productId }
        })
      ]);

      // Update the product
      return tx.product.update({
        where: {
          id: params.productId
        },
        data: {
          name,
          price,
          categoryId,
          brandId,
          descriptionId,
          isFeatured,
          isArchived,
          stock: !variations?.length ? stock : undefined,
          images: {
            deleteMany: {},
            createMany: {
              data: images.map((image: { url: string }) => image)
            }
          },
          ...(variations?.length ? {
            productSizes: {
              createMany: {
                data: variations
                  .filter((v: any) => v.sizeId)
                  .map((v: { sizeId: string, stock: number }) => ({
                    sizeId: v.sizeId,
                    stock: v.stock
                  }))
              }
            },
            productColors: {
              createMany: {
                data: variations
                  .filter((v: any) => v.colorId)
                  .map((v: { colorId: string, stock: number }) => ({
                    colorId: v.colorId,
                    stock: v.stock
                  }))
              }
            }
          } : {})
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
    });

    // Transform the response
    const transformedProduct = {
      ...product,
      sizes: product.productSizes.map(ps => ({
        id: ps.size.id,
        name: ps.size.name,
        value: ps.size.value,
        stock: ps.stock
      })),
      colors: product.productColors.map(pc => ({
        id: pc.color.id,
        name: pc.color.name,
        value: pc.color.value,
        stock: pc.stock
      })),
      productSizes: undefined,
      productColors: undefined
    };

    return NextResponse.json(transformedProduct, { headers: corsHeaders });
  } catch (error) {
    console.error('[PRODUCT_PATCH]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
}

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
