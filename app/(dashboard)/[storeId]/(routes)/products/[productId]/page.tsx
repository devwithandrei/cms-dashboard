import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import prismadb from "@/lib/prismadb";

import { ProductForm } from "./components/product-form";
import StockManagement from "@/components/stock-management";
import StockHistory from "@/components/stock-history";
import { Separator } from "@/components/ui/separator";

const ProductPage = async ({
  params
}: {
  params: { productId: string, storeId: string }
}) => {
  const { userId } = auth();

  const product = await prismadb.product.findUnique({
    where: {
      id: params.productId,
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

  const categories = await prismadb.category.findMany({
    where: {
      storeId: params.storeId,
    },
  });

  const brands = await prismadb.brand.findMany({
    where: {
      storeId: params.storeId,
    },
  });

  const descriptions = await prismadb.description.findMany({
    where: {
      storeId: params.storeId,
    },
  });

  const sizes = await prismadb.size.findMany({
    where: {
      storeId: params.storeId,
    },
  });

  const colors = await prismadb.color.findMany({
    where: {
      storeId: params.storeId,
    },
  });

  const stockHistories = await prismadb.stockHistory.findMany({
    where: {
      productId: params.productId,
    },
    include: {
      size: true,
      color: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductForm 
          categories={categories}
          brands={brands}
          descriptions={descriptions}
          sizes={sizes}
          colors={colors}
          initialData={product}
        />
        <Separator />
        {product && (
          <>
            <StockManagement
              initialVariations={product.productSizes.map((ps, index) => ({
                id: ps.id,
                size: ps.size,
                color: product.productColors[index]?.color || { id: '', name: 'N/A', value: '', createdAt: new Date(), updatedAt: new Date() },
                stock: ps.stock
              }))}
              productId={params.productId}
              storeId={params.storeId}
              userId={userId}
            />
            <Separator />
            <StockHistory
              initialHistory={stockHistories.map(history => ({
                id: history.id,
                oldStock: history.oldStock,
                newStock: history.newStock,
                changeType: history.changeType,
                reason: history.reason,
                createdAt: history.createdAt,
                createdBy: history.createdBy,
                size: history.size ? { name: history.size.name } : { name: 'N/A' },
                color: history.color ? { name: history.color.name } : { name: 'N/A' }
              }))}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default ProductPage;
