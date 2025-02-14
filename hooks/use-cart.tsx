'use client';

import { create } from 'zustand';
import { toast } from 'react-hot-toast';
import { persist, createJSONStorage } from 'zustand/middleware';

import { Product, Size, Color } from '@/types';

interface CartItem extends Product {
  quantity: number;
  selectedSize: Size;
  selectedColor: Color;
  variationId: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (data: CartItem) => void;
  removeItem: (id: string, variationId: string) => void;
  removeAll: () => void;
}

export const useCart = create(
  persist<CartStore>((set, get) => ({
    items: [],
    addItem: (data: CartItem) => {
      const currentItems = get().items;
      const existingItem = currentItems.find(
        item => item.id === data.id && item.variationId === data.variationId
      );

      if (existingItem) {
        const updatedItems = currentItems.map(item => {
          if (item.id === data.id && item.variationId === data.variationId) {
            return {
              ...item,
              quantity: item.quantity + data.quantity
            };
          }
          return item;
        });

        set({ items: updatedItems });
        toast.success('Cart updated');
      } else {
        set({ items: [...get().items, data] });
        toast.success('Item added to cart.');
      }
    },
    removeItem: (id: string, variationId: string) => {
      set({
        items: [...get().items.filter(
          item => !(item.id === id && item.variationId === variationId)
        )]
      });
      toast.success('Item removed from cart.');
    },
    removeAll: () => set({ items: [] }),
  }), {
    name: 'cart-storage',
    storage: createJSONStorage(() => localStorage)
  })
);
