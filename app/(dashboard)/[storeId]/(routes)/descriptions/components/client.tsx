/* eslint-disable import/named */

"use client";

import { Plus, Trash2, Filter } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ApiList } from "@/components/ui/api-list";
import { AlertModal } from "@/components/modals/alert-modal";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

import { columns, DescriptionColumn } from "./columns";
import { CellAction } from "./cell-action";

interface DescriptionsClientProps {
  data: DescriptionColumn[];
}

export const DescriptionsClient: React.FC<DescriptionsClientProps> = ({
  data
}) => {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [filteredData, setFilteredData] = useState<DescriptionColumn[]>(data);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  if (!params || !params.storeId) {
    return <div>Store ID is not available.</div>;
  }

  // Count of descriptions used by products and not used
  const usedCount = data.filter(item => item.usedByProducts.length > 0).length;
  const unusedCount = data.length - usedCount;

  // Filter descriptions based on usage
  const filterDescriptions = (filter: string) => {
    setActiveFilter(filter);
    let newFilteredData;
    if (filter === "used") {
      newFilteredData = data.filter(item => item.usedByProducts.length > 0);
    } else if (filter === "unused") {
      newFilteredData = data.filter(item => item.usedByProducts.length === 0);
    } else {
      newFilteredData = [...data];
    }
    setFilteredData(newFilteredData);
    // Clear selection state when filter changes
    setSelectedRows([]);
  };

  // Delete selected descriptions
  const onDeleteSelected = async () => {
    try {
      setLoading(true);
      
      // Check if any selected descriptions are in use
      const selectedDescriptions = data.filter(item => selectedRows.includes(item.id));
      const usedDescriptions = selectedDescriptions.filter(item => item.usedByProducts.length > 0);
      
      if (usedDescriptions.length > 0) {
        toast.error(`Cannot delete descriptions that are in use by products. Please remove product associations first.`);
        setOpen(false);
        return;
      }
      
      // Delete all selected descriptions using the batch delete endpoint
      await axios.delete(`/api/${params.storeId}/descriptions?ids=${selectedRows.join(',')}`);
      
      // Update the data state by removing deleted items
      const updatedData = data.filter(item => !selectedRows.includes(item.id));
      
      // Re-apply current filter to ensure consistent view
      let newFilteredData;
      if (activeFilter === "used") {
        newFilteredData = updatedData.filter(item => item.usedByProducts.length > 0);
      } else if (activeFilter === "unused") {
        newFilteredData = updatedData.filter(item => item.usedByProducts.length === 0);
      } else {
        newFilteredData = updatedData;
      }
      
      setFilteredData(newFilteredData);
      
      // Clear selection state
      setSelectedRows([]);
      
      toast.success(`${selectedRows.length} description(s) deleted successfully.`);
      
      // Add a small delay before refreshing to ensure state updates are processed
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };
  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDeleteSelected}
        loading={loading}
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Heading title={`Descriptions (${data.length})`} description="Manage descriptions for your products" />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {activeFilter === "all" ? "All" : activeFilter === "used" ? "In Use" : "Not Used"}
                <Badge variant="secondary" className="ml-1">
                  {activeFilter === "all" ? data.length : activeFilter === "used" ? usedCount : unusedCount}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by usage</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => filterDescriptions("all")}>
                All <Badge variant="secondary" className="ml-2">{data.length}</Badge>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => filterDescriptions("used")}>
                In Use <Badge variant="secondary" className="ml-2">{usedCount}</Badge>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => filterDescriptions("unused")}>
                Not Used <Badge variant="secondary" className="ml-2">{unusedCount}</Badge>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedRows.length > 0 && (
            <Button 
              onClick={() => setOpen(true)} 
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
              Delete ({selectedRows.length})
            </Button>
          )}
          <Button onClick={() => router.push(`/${params.storeId}/descriptions/new`)}>
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Button>
        </div>
      </div>
      <Separator className="my-4" />
      <DataTable 
        key={filteredData.length} // Add key to reset selection state when data changes
        searchKey="name" 
        columns={columns.map(column => {
          if (column.id === "actions") {
            return {
              ...column,
              cell: ({ row }: { row: any }) => (
                <CellAction 
                  data={row.original as DescriptionColumn} 
                  onDelete={(id) => {
                    setFilteredData(prev => prev.filter(item => item.id !== id));
                  }}
                />
              )
            };
          }
          return column;
        }) as ColumnDef<DescriptionColumn, unknown>[]} 
        data={filteredData} 
        onRowSelectionChange={(selectedRowIds: string[]) => setSelectedRows(selectedRowIds)}
      />
      <Heading title="API" description="API Calls for Descriptions" />
      <Separator />
      <ApiList entityName="descriptions" entityIdName="descriptionId" />
    </>
  );
};
