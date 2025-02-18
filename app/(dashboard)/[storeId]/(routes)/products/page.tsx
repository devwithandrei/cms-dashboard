import { format } from "date-fns";

import prismadb from "@/lib/prismadb";
import { formatter } from "@/lib/utils";

import { ProductsClient } from "./components/client";
import { ProductColumn } from "./components/columns";

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

  const formattedProducts = products.map((item: { 
    id: string; 
    name: string; 
    price: { toNumber: () => number }; 
    category: { name: string }; 
    brand: { name: string }; 
    productSizes: { size: { name: string }, stock: number }[]; 
    productColors: { color: { name: string, value: string } }[]; 
    createdAt: Date; 
    isFeatured: boolean; 
    isArchived: boolean 
  }) => ({
    id: item.id,
    name: item.name,
    isFeatured: item.isFeatured,
    isArchived: item.isArchived,
    price: formatter.format(item.price.toNumber()),
    category: item.category.name,
    brand: item.brand.name,
    size: item.productSizes.map((ps: { size: { name: string } }) => ps.size.name).join(', '),
    color: item.productColors.map((pc: { color: { name: string } }) => pc.color.name).join(', '),
    stock: item.productSizes.reduce((total, variation) => total + variation.stock, 0),
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
