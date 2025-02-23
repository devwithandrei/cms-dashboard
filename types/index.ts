import { OrderStatus as PrismaOrderStatus } from "@prisma/client";

export interface Store {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  isFeatured: boolean;
  isArchived: boolean;
  stock?: number;
  categoryId: string;
  brandId: string;
  descriptionId?: string;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
  images: Image[];
  category: Category;
  brand: Brand;
  description?: Description;
  productSizes: ProductSize[];
  productColors: ProductColor[];
}

export interface Image {
  id: string;
  url: string;
  productId: string;
}

export interface Category {
  id: string;
  name: string;
  billboardId: string;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
  billboard: Billboard;
}

export interface Billboard {
  id: string;
  label: string;
  imageUrl: string;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Size {
  id: string;
  name: string;
  value: string;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Color {
  id: string;
  name: string;
  value: string;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Brand {
  id: string;
  name: string;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
  value: string;
}

export interface Description {
  id: string;
  name: string;
  value: string;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSize {
  id: string;
  productId: string;
  sizeId: string;
  stock: number;
  size: Size;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductColor {
  id: string;
  productId: string;
  colorId: string;
  stock: number;
  color: Color;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  storeId: string;
  status: PrismaOrderStatus;
  customerName: string;
  customerEmail: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  amount: number;
  trackingNumber?: string;
  shippingMethod?: string;
  createdAt: Date;
  updatedAt: Date;
  orderItems: OrderItem[];
  userId: string;
  paymentIntentId?: string;
  isPaid: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  sizeId?: string;
  colorId?: string;
  size?: Size;
  color?: Color;
}

export interface StockHistory {
  id: string;
  productId: string;
  quantity: number;
  type: 'IN' | 'OUT';
  reason?: string;
  oldStock?: number | null;
  newStock?: number | null;
  changeType?: string | null;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}
