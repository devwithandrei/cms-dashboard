"use client";

import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ApiList } from "@/components/ui/api-list";

import { columns, DescriptionColumn } from "./columns";

interface DescriptionsClientProps {
  data: DescriptionColumn[];
}

export const DescriptionsClient: React.FC<DescriptionsClientProps> = ({
  data
}) => {
  const params = useParams();
  const router = useRouter();

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title={`Descriptions (${data.length})`} description="Manage descriptions for your products" />
        <Button onClick={() => router.push(`/${params.storeId}/descriptions/new`)}>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>
      <Separator />
      <DataTable searchKey="name" columns={columns} data={data} />
      <Heading title="API" description="API Calls for Descriptions" />
      <Separator />
      <ApiList entityName="descriptions" entityIdName="descriptionId" />
    </>
  );
};
