"use client";

import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ApiList } from "@/components/ui/api-list";

import { UserColumn, columns } from "./columns";

interface UsersClientProps {
  data: UserColumn[];
}

export const UsersClient: React.FC<UsersClientProps> = ({
  data
}) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Users (${data.length})`}
          description="Manage users and view their information"
        />
      </div>
      <Separator />
      <DataTable searchKey="email" columns={columns} data={data} />
      <Heading title="API" description="API calls for Users" />
      <Separator />
      <ApiList entityName="users" entityIdName="userId" />
    </>
  );
};
