"use client"

import * as z from "zod"
import axios from "axios"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "react-hot-toast"
import { Trash } from "lucide-react"
import { Description } from "@prisma/client"
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

type DescriptionFormValues = z.infer<typeof formSchema>

interface DescriptionFormProps {
  initialData: Description | null;
};

export const DescriptionForm: React.FC<DescriptionFormProps> = ({
  initialData
}) => {
  const params = useParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData ? 'Edit Description' : 'Create Description';
  const description = initialData ? 'Edit a Description.' : 'Add a new Description';
  const toastMessage = initialData ? 'Description updated.' : 'Description created.';
  const action = initialData ? 'Save changes' : 'Create';

  const form = useForm<DescriptionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: ''
    }
  });

  const onSubmit = async (data: DescriptionFormValues) => {
    try {
      setLoading(true);
      if (!params || !params.storeId || !params.descriptionId) {
        toast.error('Store ID or Description ID is not available.');
        return; // Handle the case appropriately
    }
      if (initialData) {
        await axios.patch(`/api/${params.storeId}/descriptions/${params.descriptionId}`, data);
      } else {
        if (!params || !params.storeId) {
          toast.error('Store ID is not available.');
          return;
        }
        await axios.post(`/api/${params.storeId}/descriptions`, data);
      }
      if (params && params.storeId) {
        router.push(`/${params.storeId}/descriptions`);
        setTimeout(() => {
          router.refresh();
        }, 300);
      } else {
        toast.error('Store ID not found.');
      }
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
      if (!params || !params.storeId || !params.descriptionId) {
        toast.error('Store ID or Description ID is not available.');
        return;
      }
      await axios.delete(`/api/${params.storeId}/descriptions/${params.descriptionId}`);
      if (params && params.storeId) {
        router.push(`/${params.storeId}/descriptions`);
        setTimeout(() => {
          router.refresh();
        }, 300);
      } else {
        toast.error('Store ID not found.');
      }
      toast.success('Description deleted.');
    } catch (error: any) {
      toast.error('Make sure you removed all products using this Description first.');
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
                    <Input disabled={loading} placeholder="Description name" {...field} />
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
                    <Input disabled={loading} placeholder="Description value" {...field} />
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
