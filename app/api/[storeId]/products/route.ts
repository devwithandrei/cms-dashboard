import { NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';
import { auth } from '@clerk/nextjs';

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
  variations?: ProductVariation[];
  stock?: number;
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
      console.log(`Processing product ${product.id}:`, {
        name: product.name,
        productSizesCount: product.productSizes.length,
        productColorsCount: product.productColors.length
      });

      // Map sizes from productSizes
      const sizes = product.productSizes.map(ps => {
        console.log('Processing size:', {
          sizeId: ps.size.id,
          sizeName: ps.size.name,
          sizeValue: ps.size.value,
          stock: ps.stock
        });
        return {
          id: ps.size.id,
          name: ps.size.name,
          value: ps.size.value,
          stock: ps.stock
        };
      });

      // Map colors from productColors
      const colors = product.productColors.map(pc => {
        console.log('Processing color:', {
          colorId: pc.color.id,
          colorName: pc.color.name,
          colorValue: pc.color.value,
          stock: pc.stock
        });
        return {
          id: pc.color.id,
          name: pc.color.name,
          value: pc.color.value,
          stock: pc.stock
        };
      });

      const transformed = {
        id: product.id,
        category: product.category,
        name: product.name,
        price: product.price.toString(),
        isFeatured: product.isFeatured,
        isArchived: product.isArchived,
        brand: product.brand,
        description: product.description,
        images: product.images,
        sizes,
        colors,
        stock: product.stock,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString()
      };

      console.log(`Transformed product ${product.id}:`, {
        sizeCount: transformed.sizes.length,
        colorCount: transformed.colors.length,
        sizes: transformed.sizes,
        colors: transformed.colors,
        stock: transformed.stock
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
    const body: ProductRequestBody = await req.json();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403, headers: corsHeaders });
    }

    if (!body.name) {
      return new NextResponse("Name is required", { status: 400, headers: corsHeaders });
    }

    if (!body.images || !body.images.length) {
      return new NextResponse("Images are required", { status: 400, headers: corsHeaders });
    }

    if (!body.price) {
      return new NextResponse("Price is required", { status: 400, headers: corsHeaders });
    }

    if (!body.categoryId) {
      return new NextResponse("Category id is required", { status: 400, headers: corsHeaders });
    }

    if (!body.brandId) {
      return new NextResponse("Brand id is required", { status: 400, headers: corsHeaders });
    }

    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400, headers: corsHeaders });
    }

    // Ensure stock is provided if no variations
    if (!body.variations?.length && typeof body.stock !== 'number') {
      return new NextResponse("Base stock is required for products without variations", { status: 400, headers: corsHeaders });
    }

    console.log('Creating product with variations:', body.variations);

    const store = await prismadb.store.findFirst({
      where: {
        id: params.storeId,
        userId
      }
    });

    if (!store) {
      return new NextResponse("Unauthorized", { status: 405, headers: corsHeaders });
    }

    // Create the product with optional stock field
    const product = await prismadb.product.create({
      data: {
        name: body.name,
        price: body.price,
        isFeatured: body.isFeatured,
        isArchived: body.isArchived,
        categoryId: body.categoryId,
        brandId: body.brandId,
        storeId: params.storeId,
        descriptionId: body.descriptionId,
        stock: body.stock,
        images: {
          createMany: {
            data: body.images.map((image: { url: string }) => image),
          },
        },
      },
    });

    console.log('Created product:', product);

    // Create product variations if provided and not empty
    if (body.variations?.length) {
      const validVariations = body.variations.filter(v => v.sizeId || v.colorId);
      
      if (validVariations.length > 0) {
        const productSizes = validVariations
          .filter(v => v.sizeId)
          .map((variation: ProductVariation) => ({
            productId: product.id,
            sizeId: variation.sizeId!,
            stock: variation.stock,
          }));

        const productColors = validVariations
          .filter(v => v.colorId)
          .map((variation: ProductVariation) => ({
            productId: product.id,
            colorId: variation.colorId!,
            stock: variation.stock,
          }));

        console.log('Creating sizes:', productSizes);
        console.log('Creating colors:', productColors);

        // Create sizes and colors in parallel if they exist
        await Promise.all([
          productSizes.length > 0 && prismadb.productSize.createMany({
            data: productSizes
          }),
          productColors.length > 0 && prismadb.productColor.createMany({
            data: productColors
          })
        ].filter(Boolean));
      }
    }

    // Fetch the complete product with all relations
    const completeProduct = await prismadb.product.findUnique({
      where: { id: product.id },
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
      }
    });

    if (!completeProduct) {
      throw new Error("Failed to fetch complete product after creation");
    }

    console.log('Complete product:', {
      id: completeProduct.id,
      sizeCount: completeProduct.productSizes.length,
      colorCount: completeProduct.productColors.length,
      stock: completeProduct.stock,
      sizes: completeProduct.productSizes.map(ps => ({
        id: ps.size.id,
        name: ps.size.name,
        value: ps.size.value,
        stock: ps.stock
      })),
      colors: completeProduct.productColors.map(pc => ({
        id: pc.color.id,
        name: pc.color.name,
        value: pc.color.value,
        stock: pc.stock
      }))
    });

    // Transform the response to match the GET endpoint format
    const transformedProduct = {
      id: completeProduct.id,
      category: completeProduct.category,
      name: completeProduct.name,
      price: completeProduct.price.toString(),
      isFeatured: completeProduct.isFeatured,
      isArchived: completeProduct.isArchived,
      brand: completeProduct.brand,
      description: completeProduct.description,
      images: completeProduct.images,
      sizes: completeProduct.productSizes.map(ps => ({
        id: ps.size.id,
        name: ps.size.name,
        value: ps.size.value,
        stock: ps.stock
      })),
      colors: completeProduct.productColors.map(pc => ({
        id: pc.color.id,
        name: pc.color.name,
        value: pc.color.value,
        stock: pc.stock
      })),
      stock: completeProduct.stock,
      createdAt: completeProduct.createdAt.toISOString(),
      updatedAt: completeProduct.updatedAt.toISOString()
    };

    console.log('Transformed product:', {
      id: transformedProduct.id,
      sizeCount: transformedProduct.sizes.length,
      colorCount: transformedProduct.colors.length,
      stock: transformedProduct.stock,
      sizes: transformedProduct.sizes,
      colors: transformedProduct.colors
    });

    return NextResponse.json(transformedProduct, { headers: corsHeaders });
  } catch (error) {
    console.log('[PRODUCTS_POST]', error);
    return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
  }
};
