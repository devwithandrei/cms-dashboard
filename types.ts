import { type Decimal } from "@prisma/client/runtime/library";

export type Category = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Size = {
  id: string;
  name: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Color = {
  id: string;
  name: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Brand = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Description = {
  id: string;
  name: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Product = {
  id: string;
  name: string;
  price: Decimal;
  isFeatured: boolean;
  isArchived: boolean;
  categoryId: string;
  brandId: string;
  descriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
  images: { url: string }[];
  url: string;
  productSizes: ProductSize[];
  productColors: ProductColor[];
};

export type ProductSize = {
  id: string;
  productId: string;
  sizeId: string;
  stock: number;
  size: Size;
};

export type ProductColor = {
  id: string;
  productId: string;
  colorId: string;
  stock: number;
  color: Color;
};

export type Order = {
  id: string;
  storeId: string;
  isPaid: boolean;
  phone: string;
  address: string;
  customerName: string;
  customerEmail: string;
  city: string;
  country: string;
  postalCode: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  shippingMethod?: string;
  createdAt: Date;
  updatedAt: Date;
  orderItems: OrderItem[];
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  sizeId?: string;
  colorId?: string;
  quantity: number;
  price: Decimal;
  product: Product;
  size?: Size;
  color?: Color;
};
