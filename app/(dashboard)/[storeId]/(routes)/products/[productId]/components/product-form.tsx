"use client"

import * as z from "zod"
import axios from "axios"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "react-hot-toast"
import { Trash, Plus, X } from "lucide-react"
import { Category, Color, Image, Product, Size, Brand, Description, ProductSize, ProductColor } from "@prisma/client"
import { useParams, useRouter } from "next/navigation"
import { CheckedState } from "@radix-ui/react-checkbox"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Heading } from "@/components/ui/heading"
import { AlertModal } from "@/components/modals/alert-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ImageUpload from "@/components/ui/image-upload"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

const formSchema = z.object({
  name: z.string().min(1),
  images: z.object({ url: z.string() }).array(),
  price: z.coerce.number().min(1),
  stock: z.coerce.number().min(0),
  categoryId: z.string().min(1),
  brandId: z.string().min(1),
  descriptionId: z.string().min(1),
  isFeatured: z.boolean().default(false).optional(),
  isArchived: z.boolean().default(false).optional(),
  sizes: z.array(z.object({
    sizeId: z.string().optional()
  })).optional(),
  colors: z.array(z.object({
    colorId: z.string().optional()
  })).optional()
});

type ProductFormValues = z.infer<typeof formSchema>

interface ProductFormProps {
  initialData: Product & {
    images: Image[]
    productSizes: (ProductSize & { size: Size })[]
    productColors: (ProductColor & { color: Color })[]
  } | null;
  categories: Category[];
  colors: Color[];
  sizes: Size[];
  brands: Brand[];
  descriptions: Description[];
};

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories,
  sizes,
  brands,
  descriptions,
  colors
}) => {
  const params = useParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      ...initialData,
      price: parseFloat(String(initialData?.price)),
      descriptionId: initialData?.descriptionId || '',
      isFeatured: initialData?.isFeatured || false,
      isArchived: initialData?.isArchived || false,
      stock: initialData?.stock || 0,
      sizes: initialData.productSizes.map((ps) => ({
        sizeId: ps.sizeId
      })),
      colors: initialData.productColors.map((pc) => ({
        colorId: pc.colorId
      }))
    } : {
      name: '',
      images: [],
      price: 0,
      stock: 0,
      categoryId: '',
      brandId: '',
      descriptionId: '',
      isFeatured: false,
      isArchived: false,
      sizes: [],
      colors: []
    }
  });

  if (!params) {
    toast.error('Params are not available.');
    return;
  }

  if (!params.storeId || !params.productId) {
    toast.error('Store ID or Product ID is not available.');
    return;
  }

  const title = initialData ? 'Edit product' : 'Create product';
  const description = initialData ? 'Edit a product.' : 'Add a new product';
  const toastMessage = initialData ? 'Product updated.' : 'Product created.';
  const action = initialData ? 'Save changes' : 'Create';

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setLoading(true);
      if (initialData) {
        await axios.patch(`/api/${params.storeId}/products/${params.productId}`, data);
      } else {
        const response = await axios.post(`/api/${params.storeId}/products`, data);
        console.log('Created product:', response.data);
      }
      router.push(`/${params.storeId}/products`);
      router.refresh();
      toast.success(toastMessage);
    } catch (error: any) {
      console.error('Error creating/updating product:', error.response?.data || error);
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/${params.storeId}/products/${params.productId}`);
      router.push(`/${params.storeId}/products`);
      router.refresh();
      toast.success('Product deleted.');
    } catch (error: any) {
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  const addSize = () => {
    const currentSizes = form.getValues('sizes') || [];
    form.setValue('sizes', [
      ...currentSizes,
      { sizeId: '' }
    ]);
  };

  const addColor = () => {
    const currentColors = form.getValues('colors') || [];
    form.setValue('colors', [
      ...currentColors,
      { colorId: '' }
    ]);
  };

  const removeSize = (index: number) => {
    const currentSizes = form.getValues('sizes') || [];
    form.setValue('sizes', currentSizes.filter((_, i) => i !== index));
  };

  const removeColor = (index: number) => {
    const currentColors = form.getValues('colors') || [];
    form.setValue('colors', currentColors.filter((_, i) => i !== index));
  };

  const handleCheckboxChange = (field: any, checked: CheckedState) => {
    field.onChange(checked === true);
  };

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
          <FormField
            control={form.control}
            name="images"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Images</FormLabel>
                <FormControl>
                  <ImageUpload 
                    value={field.value.map((image) => image.url)} 
                    disabled={loading} 
                    onChange={(url) => field.onChange([...field.value, { url }])}
                    onRemove={(url) => field.onChange([...field.value.filter((current) => current.url !== url)])}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="md:grid md:grid-cols-3 gap-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="Product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input type="number" disabled={loading} placeholder="9.99" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock</FormLabel>
                  <FormControl>
                    <Input type="number" disabled={loading} placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select disabled={loading} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue defaultValue={field.value} placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brandId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <Select disabled={loading} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue defaultValue={field.value} placeholder="Select a brand" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descriptionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <Select disabled={loading} onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue defaultValue={field.value} placeholder="Select a description" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {descriptions.map((description) => (
                        <SelectItem key={description.id} value={description.id}>{description.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-8">
            {/* Sizes Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Heading title="Sizes" description="Add available sizes for this product (optional)" />
                <Button 
                  type="button" 
                  onClick={addSize}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Size
                </Button>
              </div>
              <div className="space-y-4">
                {form.watch('sizes')?.map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`sizes.${index}.sizeId`}
                        render={({ field }) => (
                          <FormItem>
                            <Select 
                              disabled={loading} 
                              onValueChange={field.onChange} 
                              value={field.value || ''} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue defaultValue={field.value} placeholder="Select a size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {sizes.map((size) => (
                                  <SelectItem key={size.id} value={size.id}>{size.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeSize(index)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Colors Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Heading title="Colors" description="Add available colors for this product (optional)" />
                <Button 
                  type="button" 
                  onClick={addColor}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Color
                </Button>
              </div>
              <div className="space-y-4">
                {form.watch('colors')?.map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`colors.${index}.colorId`}
                        render={({ field }) => (
                          <FormItem>
                            <Select 
                              disabled={loading} 
                              onValueChange={field.onChange} 
                              value={field.value || ''} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue defaultValue={field.value} placeholder="Select a color" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {colors.map((color) => (
                                  <SelectItem key={color.id} value={color.id}>{color.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeColor(index)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="md:grid md:grid-cols-3 gap-8">
            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => handleCheckboxChange(field, checked)}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Featured
                    </FormLabel>
                    <FormDescription>
                      This product will appear on the home page
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isArchived"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => handleCheckboxChange(field, checked)}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Archived
                    </FormLabel>
                    <FormDescription>
                      This product will not appear anywhere in the store
                    </FormDescription>
                  </div>
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
}

export default ProductForm;
