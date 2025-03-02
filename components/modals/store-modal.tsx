"use client";

import * as z from "zod"
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Store as StoreIcon, Loader2 } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useStoreModal } from "@/hooks/use-store-modal";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(1, "Store name is required").max(50, "Store name must be less than 50 characters"),
});

export const StoreModal = () => {
  const storeModal = useStoreModal();
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/stores', values);
      
      // Show success message
      toast.success('Store created successfully!');
      
      // Refresh router and redirect
      router.refresh();
      window.location.assign(`/${response.data.id}`);
    } catch (error: any) {
      // Show more specific error message if available
      const errorMessage = error.response?.data || 'Something went wrong. Please try again.';
      toast.error(errorMessage);
      console.error('[STORE_CREATION_ERROR]', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create your store"
      description="Add a new store to manage products and categories."
      isOpen={storeModal.isOpen} 
      onClose={() => {
        // Only allow closing if we have existing stores
        if (!loading) {
          form.reset();
          storeModal.onClose();
        }
      }}
    >
      <div className="space-y-4 py-2 pb-4">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-primary/10 p-6 ring-1 ring-primary/20">
            <StoreIcon className="h-10 w-10 text-primary" />
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Store Name</FormLabel>
                  <FormControl>
                    <Input 
                      disabled={loading} 
                      placeholder="My Awesome Store" 
                      {...field} 
                      className="h-10 focus:ring-2 focus:ring-primary/30"
                      autoFocus
                    />
                  </FormControl>
                  <FormDescription>
                    This is how your store will appear to customers.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="pt-2 space-x-2 flex items-center justify-end w-full">
              <Button 
                disabled={loading} 
                variant="outline" 
                onClick={() => {
                  if (!loading) {
                    form.reset();
                    storeModal.onClose();
                  }
                }}
                type="button"
                className="transition-all duration-200"
              >
                Cancel
              </Button>
              <Button 
                disabled={loading} 
                type="submit"
                className="transition-all duration-200 relative"
              >
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {loading ? 'Creating...' : 'Create Store'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Modal>
  );
};
