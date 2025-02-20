import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import prismadb from "@/lib/prismadb";
import toast from 'react-hot-toast';

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

  if (!params) {
    return null;
  }

  if (!params) {
    toast.error('Params is not available.');
    return;
  }

  if (!params.storeId || !params.productId) {
    toast.error('Store ID or Product ID is not available.');
    return;
  }

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

  const transformedProduct = product;

  const categories = await prismadb.category.findMany({
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

  const stockHistories = await prismadb.stockHistory.findMany({
    where: {
      productId: params.productId,
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
          sizes={sizes}
          colors={colors}
          brands={brands}
          descriptions={descriptions}
          initialData={transformedProduct}
        />
        <Separator />
        {transformedProduct && (
          <>
            <StockManagement
              productId={params.productId}
              storeId={params.storeId}
              userId={userId}
              currentStock={transformedProduct.stock ?? 0}
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
                createdBy: history.createdBy
              }))}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default ProductPage;
