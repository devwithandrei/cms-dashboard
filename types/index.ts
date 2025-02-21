// This should match the enum in schema.prisma
export const OrderStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  DELIVERED: 'DELIVERED',
  CANCELED: 'CANCELED'
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export interface Order {
  id: string;
  storeId: string;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
  orderItems?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  colorId?: string | null;
  price: number;
  quantity: number;
  sizeId?: string | null;
}
