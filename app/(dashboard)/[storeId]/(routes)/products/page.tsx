import { format } from "date-fns";

import prismadb from "@/lib/prismadb";
import { formatter } from "@/lib/utils";

import { ProductsClient } from "./components/client";
import { ProductColumn } from "./components/columns";

// Add this to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ProductsPage = async ({
  params
}: {
  params: { storeId: string }
}) => {
  const products = await prismadb.product.findMany({
    where: {
      storeId: params.storeId
    },
    include: {
      category: true,
      productSizes: {
        include: {
          size: true
        }
      },
      brand: true,
      productColors: {
        include: {
          color: true
        }
      },
      images: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const formattedProducts = products.map((item) => ({
    id: item.id,
    name: item.name,
    isFeatured: item.isFeatured,
    isArchived: item.isArchived,
    price: formatter.format(item.price.toNumber()),
    category: item.category.name,
    brand: item.brand.name,
    size: item.productSizes.map(ps => ps.size.name).join(', ') || 'None',
    color: item.productColors.map(pc => pc.color.name).join(', ') || 'None',
    stock: item.stock || 0,
    createdAt: format(item.createdAt, 'MMMM do, yyyy'),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductsClient data={formattedProducts} />
      </div>
    </div>
  );
};

export default ProductsPage;
