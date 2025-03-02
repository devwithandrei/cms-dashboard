import { NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';
import { auth } from '@clerk/nextjs';
import { sendOutlyWebhook } from "@/lib/webhook-utils";

// Add this to prevent caching
export const dynamic = 'force-dynamic';

interface ProductVariation {
  sizeId?: string;
  colorId?: string;
  stock: number;
}

interface ProductRequestBody {
  name: string;
  price: number;
  categoryId: string;
  brandId: string;
  stock: number;
  sizes?: { sizeId: string }[];
  colors?: { colorId: string }[];
  images: { url: string }[];
  isFeatured?: boolean;
  isArchived?: boolean;
  descriptionId: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId') || undefined;
    const brandId = searchParams.get('brandId') || undefined;
    const sizeId = searchParams.get('sizeId') || undefined;
    const colorId = searchParams.get('colorId') || undefined;
    const isFeatured = searchParams.get('isFeatured');

    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400, headers: corsHeaders });
    }

    console.log('Fetching products with params:', { categoryId, brandId, sizeId, colorId, isFeatured });

    const products = await prismadb.product.findMany({
      where: {
        storeId: params.storeId,
        categoryId,
        brandId,
        isFeatured: isFeatured === 'true' ? true : undefined,
        isArchived: false,
        ...(sizeId && {
          productSizes: {
            some: {
              sizeId
            }
          }
        }),
        ...(colorId && {
          productColors: {
            some: {
              colorId
            }
          }
        })
      },
      include: {
        category: true,
        brand: true,
        description: true,
        images: true,
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
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    console.log('Found products:', products.length);

    // Transform the data to match the frontend's expected format
    const transformedProducts = products.map(product => {
      const transformed = {
        id: product.id,
        name: product.name,
        price: product.price.toString(),
        isFeatured: product.isFeatured,
        isArchived: product.isArchived,
        category: product.category,
        brand: product.brand,
        description: product.description,
        images: product.images,
        stock: product.stock,
        sizes: product.productSizes.map(ps => ({
          id: ps.size.id,
          name: ps.size.name,
          value: ps.size.value
        })),
        colors: product.productColors.map(pc => ({
          id: pc.color.id,
          name: pc.color.name,
          value: pc.color.value
        }))
      };

      console.log(`Transformed product ${product.id}:`, {
        name: transformed.name,
        stock: transformed.stock,
        sizeCount: transformed.sizes.length,
        colorCount: transformed.colors.length
      });

      return transformed;
    });

    return NextResponse.json(transformedProducts, { headers: corsHeaders });
  } catch (error) {
    console.error('[PRODUCTS_GET]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    console.log('Received body:', body);

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

    console.log('Creating product with sizes:', sizes);
    console.log('Creating product with colors:', colors);

    const product = await prismadb.product.create({
      data: {
        name,
        price,
        stock: stock || 0,
        categoryId,
        brandId,
        descriptionId,
        storeId: params.storeId,
        isFeatured: isFeatured || false,
        isArchived: isArchived || false,
        images: {
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
        }
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

    console.log('Created product:', product);

    // Send webhook to Outly
    await sendOutlyWebhook('product.created', product);

    return NextResponse.json(product, { headers: corsHeaders });
  } catch (error) {
    console.log('[PRODUCTS_POST]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
};
