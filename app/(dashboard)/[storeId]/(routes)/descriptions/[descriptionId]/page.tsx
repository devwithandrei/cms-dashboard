import prismadb from "@/lib/prismadb";

import { DescriptionForm } from "./components/description-form";

const DescriptionPage = async ({
  params
}: {
  params: { descriptionId: string }
}) => {
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
