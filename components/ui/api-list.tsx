"use client";

import { useParams } from "next/navigation";
import { useOrigin } from "@/hooks/use-origin";
import { ApiAlert } from "@/components/ui/api-alert";
import { cn } from "@/lib/utils";

interface ApiListProps {
  entityName: string;
  entityIdName: string;
}

export const ApiList: React.FC<ApiListProps> = ({
  entityName,
  entityIdName,
}) => {
  const params = useParams();
  const origin = useOrigin();

  const baseUrl = `${origin}/api/${params.storeId}`;

  return (
    <div className="space-y-4 dark:bg-gray-900">
      <ApiAlert 
        title="GET" 
        variant="public" 
        description={`${baseUrl}/${entityName}`}
        className="dark:bg-gray-800 dark:border-gray-700"
      />
      <ApiAlert 
        title="GET" 
        variant="public" 
        description={`${baseUrl}/${entityName}/{${entityIdName}}`}
        className="dark:bg-gray-800 dark:border-gray-700"
      />
      <ApiAlert 
        title="POST" 
        variant="admin" 
        description={`${baseUrl}/${entityName}`}
        className="dark:bg-gray-800 dark:border-gray-700"
      />
      <ApiAlert 
        title="PATCH" 
        variant="admin" 
        description={`${baseUrl}/${entityName}/{${entityIdName}}`}
        className="dark:bg-gray-800 dark:border-gray-700"
      />
      <ApiAlert 
        title="DELETE" 
        variant="admin" 
        description={`${baseUrl}/${entityName}/{${entityIdName}}`}
        className="dark:bg-gray-800 dark:border-gray-700"
      />
    </div>
  );
};
