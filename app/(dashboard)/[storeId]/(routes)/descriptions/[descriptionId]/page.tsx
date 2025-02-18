import prismadb from "@/lib/prismadb";
import { toast } from 'react-hot-toast';

import { DescriptionForm } from "./components/description-form";

const DescriptionPage = async ({
  params
}: {
  params: { storeId: string; descriptionId: string }
}) => {
  if (!params) {
    toast.error('Params is not available.');
    return;
  }

  if (!params.storeId || !params.descriptionId) {
    toast.error('Store ID or Description ID is not available.');
    return;
  }

  const description = await prismadb.description.findUnique({
    where: {
      id: params.descriptionId
    }
  });

  return ( 
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <DescriptionForm initialData={description} />
      </div>
    </div>
  );
}

export default DescriptionPage;
