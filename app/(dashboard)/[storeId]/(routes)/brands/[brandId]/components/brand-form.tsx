"use client"

import * as z from "zod"
import axios from "axios"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "react-hot-toast"
import { Trash } from "lucide-react"
import { Brand } from "@prisma/client"
import { useParams, useRouter } from "next/navigation"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Heading } from "@/components/ui/heading"
import { AlertModal } from "@/components/modals/alert-modal"

const formSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
});

type BrandFormValues = z.infer<typeof formSchema>

interface BrandFormProps {
  initialData: Brand | null;
};

export const BrandForm: React.FC<BrandFormProps> = ({
  initialData
}) => {
  const params = useParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData ? 'Edit Brand' : 'Create Brand';
  const description = initialData ? 'Edit a Brand.' : 'Add a new Brand';
  const toastMessage = initialData ? 'Brand updated.' : 'Brand created.';
  const action = initialData ? 'Save changes' : 'Create';

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: ''
    }
  });

  const onSubmit = async (data: BrandFormValues) => {
    try {
      setLoading(true);
      if (!params?.storeId || !params?.brandId) {
        toast.error("Missing storeId or brandId.");
        return;
      }
      const { storeId, brandId } = params;

      if (initialData) {
        await axios.patch(`/api/${storeId}/brands/${brandId}`, data);
      } else {
        await axios.post(`/api/${storeId}/brands`, data);
      }
      router.push(`/${params.storeId}/brands`);
      router.refresh();
      toast.success(toastMessage);
    } catch (error: any) {
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      if (!params?.storeId || !params?.brandId) {
        toast.error("Missing storeId or brandId.");
        return;
      }
      const { storeId, brandId } = params;
      await axios.delete(`/api/${storeId}/brands/${brandId}`);
      router.push(`/${storeId}/brands`);
      router.refresh();
      toast.success('Brand deleted.');
    } catch (error: any) {
      toast.error('Make sure you removed all products using this Brand first.');
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <>
    <AlertModal 
      isOpen={open} 
      onClose={() => setOpen(false)}
      onConfirm={onDelete}
      loading={loading}
    />
     <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={loading}
            variant="destructive"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
          <div className="md:grid md:grid-cols-3 gap-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="Brand name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="Brand value" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button disabled={loading} className="ml-auto" type="submit">
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};
