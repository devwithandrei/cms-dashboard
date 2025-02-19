import Stripe from "stripe";
import { NextResponse } from "next/server";
import { stripe, handleStripeError } from "@/lib/stripe";
import prismadb from "@/lib/prismadb";
import { Product, Size, Color } from "@/types";

interface ProductSize {
  id: string;
  productId: string;
  sizeId: string;
  stock: number;
  size: {
    id: string;
    name: string;
  };
}

interface ProductColor {
  id: string;
  productId: string;
  colorId: string;
  stock: number;
  color: {
    id: string;
    name: string;
  };
}

interface ProductWithStock {
  id: string;
  name: string;
  price: any;
  stock: number | null;
  images: { url: string }[];
  productSizes: ProductSize[];
  productColors: ProductColor[];
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    console.log('Received checkout request for store:', params.storeId);
    
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { productIds, sizes, colors, quantities, customerDetails } = body;

    if (!productIds || productIds.length === 0) {
      console.log('Missing product IDs');
      return new NextResponse("Product ids are required", { 
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!customerDetails) {
      console.log('Missing customer details');
      return new NextResponse("Customer details are required", { 
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log('Validating store...');
    const store = await prismadb.store.findUnique({
      where: {
        id: params.storeId
      }
    });

    if (!store) {
      console.log('Store not found:', params.storeId);
      return new NextResponse("Store not found", { 
        status: 404,
        headers: corsHeaders,
      });
    }

    console.log('Fetching products...');
    const products = await prismadb.product.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      include: {
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
    console.log('Found products:', products.length);

    if (products.length !== productIds.length) {
      console.log('Some products not found. Requested:', productIds.length, 'Found:', products.length);
      return new NextResponse("Some products not found", { 
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate stock for each product
    for (let i = 0; i < productIds.length; i++) {
      const product = products.find(p => p.id === productIds[i]) as unknown as ProductWithStock;
      if (!product) continue;

      const quantity = quantities[i];
      const sizeId = sizes[i];
      const colorId = colors[i];

      // Check stock based on product type
      if (!sizeId && !colorId) {
        // Product without variations
        if (!product.stock || product.stock < quantity) {
          return new NextResponse(`Product ${product.name} is out of stock`, {
            status: 400,
            headers: corsHeaders,
          });
        }
      } else if (sizeId && !colorId) {
        // Product with only size
        const sizeVariation = product.productSizes.find(ps => ps.size.id === sizeId);
        if (!sizeVariation || sizeVariation.stock < quantity) {
          return new NextResponse(`Selected size for ${product.name} is out of stock`, {
            status: 400,
            headers: corsHeaders,
          });
        }
      } else if (!sizeId && colorId) {
        // Product with only color
        const colorVariation = product.productColors.find(pc => pc.color.id === colorId);
        if (!colorVariation || colorVariation.stock < quantity) {
          return new NextResponse(`Selected color for ${product.name} is out of stock`, {
            status: 400,
            headers: corsHeaders,
          });
        }
      } else if (sizeId && colorId) {
        // Product with both size and color
        const sizeVariation = product.productSizes.find(ps => ps.size.id === sizeId);
        if (!sizeVariation || sizeVariation.stock < quantity) {
          return new NextResponse(`Selected variation for ${product.name} is out of stock`, {
            status: 400,
            headers: corsHeaders,
          });
        }
      }
    }

    try {
      console.log('Creating order...');
      const orderData = {
        storeId: params.storeId,
        isPaid: false,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        phone: customerDetails.phone,
        address: customerDetails.address,
        city: customerDetails.city,
        country: customerDetails.country,
        postalCode: customerDetails.postalCode,
        orderItems: {
          create: productIds.map((productId: string, index: number) => {
            const product = products.find(p => p.id === productId);
            if (!product) throw new Error(`Product not found: ${productId}`);

            const orderItem: any = {
              product: {
                connect: {
                  id: productId
                }
              },
              quantity: quantities[index],
              price: product.price
            };

            // Only include size if it exists and is not empty
            if (sizes[index] && sizes[index].trim() !== '') {
              orderItem.size = {
                connect: {
                  id: sizes[index]
                }
              };
            }

            // Only include color if it exists and is not empty
            if (colors[index] && colors[index].trim() !== '') {
              orderItem.color = {
                connect: {
                  id: colors[index]
                }
              };
            }

            return orderItem;
          })
        }
      };

      console.log('Order data:', JSON.stringify(orderData, null, 2));

      const order = await prismadb.order.create({
        data: orderData,
        include: {
          orderItems: {
            include: {
              product: {
                include: {
                  images: true
                }
              },
              size: true,
              color: true
            }
          }
        }
      });
      console.log('Order created successfully:', order.id);

      const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

      order.orderItems.forEach((item) => {
        const itemName = [
          item.product.name,
          item.size?.name,
          item.color?.name
        ].filter(Boolean).join(' - ');

        line_items.push({
          quantity: item.quantity,
          price_data: {
            currency: 'EUR',
            product_data: {
              name: itemName,
              images: item.product.images.map(img => img.url),
            },
            unit_amount: Math.round(Number(item.price) * 100)
          }
        });
      });

      console.log('Creating Stripe session...');
      const session = await stripe.checkout.sessions.create({
        line_items,
        mode: 'payment',
        billing_address_collection: 'required',
        phone_number_collection: {
          enabled: true
        },
        success_url: `${process.env.FRONTEND_STORE_URL}/cart?success=1`,
        cancel_url: `${process.env.FRONTEND_STORE_URL}/cart?canceled=1`,
        metadata: {
          orderId: order.id
        },
      });
      console.log('Stripe session created:', session.id);

      // Update stock after successful order creation
      for (let i = 0; i < productIds.length; i++) {
        const product = products.find(p => p.id === productIds[i]) as unknown as ProductWithStock;
        if (!product) continue;

        const quantity = quantities[i];
        const sizeId = sizes[i];
        const colorId = colors[i];

        if (!sizeId && !colorId) {
          // Product without variations
          await prismadb.product.update({
            where: { id: product.id },
            data: { stock: { decrement: quantity } }
          });
        } else if (sizeId && !colorId) {
          // Product with only size
          await prismadb.productSize.update({
            where: { productId_sizeId: { productId: product.id, sizeId: sizeId } },
            data: { stock: { decrement: quantity } }
          });
        } else if (!sizeId && colorId) {
          // Product with only color
          await prismadb.productColor.update({
            where: { productId_colorId: { productId: product.id, colorId: colorId } },
            data: { stock: { decrement: quantity } }
          });
        } else if (sizeId && colorId) {
          // Product with both size and color
          await prismadb.productSize.update({
            where: { productId_sizeId: { productId: product.id, sizeId: sizeId } },
            data: { stock: { decrement: quantity } }
          });
          await prismadb.productColor.update({
            where: { productId_colorId: { productId: product.id, colorId: colorId } },
            data: { stock: { decrement: quantity } }
          });
        }
      }

      return NextResponse.json({ url: session.url }, {
        headers: corsHeaders
      });
    } catch (dbError) {
      console.error('Database error creating order:', dbError);
      if (dbError instanceof Error) {
        return new NextResponse(`Database error: ${dbError.message}`, {
          status: 500,
          headers: corsHeaders
        });
      }
      return new NextResponse('Failed to create order in database', {
        status: 500,
        headers: corsHeaders
      });
    }
  } catch (error) {
    console.error('[STRIPE_ERROR] Full error:', error);
    if (error instanceof Error) {
      console.error('[STRIPE_ERROR] Error message:', error.message);
      console.error('[STRIPE_ERROR] Error stack:', error.stack);
    }
    return new NextResponse(handleStripeError(error).error, { 
      status: 500,
      headers: corsHeaders,
    });
  }
}

