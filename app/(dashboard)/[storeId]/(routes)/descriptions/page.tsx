import { format } from "date-fns";

import prismadb from "@/lib/prismadb";

import { DescriptionColumn } from "./components/columns"
import { DescriptionsClient } from "./components/client";

const DescriptionsPage = async ({
  params
}: {
  params: { storeId: string }
}) => {
  const descriptions = await prismadb.description.findMany({
    where: {
      storeId: params.storeId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const formattedDescriptions: DescriptionColumn[] = descriptions.map((item) => ({
    id: item.id,
    name: item.name,
    value: item.value,
    createdAt: format(item.createdAt, 'MMMM do, yyyy'),
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
