import { format } from "date-fns";

import prismadb, { withRetry } from "@/lib/prismadb";

import { DescriptionColumn } from "./components/columns"
import { DescriptionsClient } from "./components/client";

// Add this to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DescriptionsPage = async ({
  params
}: {
  params: { storeId: string }
}) => {
  const descriptions = await withRetry(() => prismadb.description.findMany({
    where: {
      storeId: params.storeId
    },
    include: {
      products: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  }), 3, 500);

  const formattedDescriptions: DescriptionColumn[] = descriptions.map((item: any) => ({
    id: item.id,
    name: item.name,
    value: item.value,
    createdAt: format(item.createdAt, 'MMMM do, yyyy'),
    usedByProducts: item.products,
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <DescriptionsClient data={formattedDescriptions} />
      </div>
    </div>
  );
};

export default DescriptionsPage;
