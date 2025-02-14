'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Product } from '@/types';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { formatter } from '@/lib/utils';

interface CartItemProps {
  data: any;
}

const CartItem: React.FC<CartItemProps> = ({
  data
}) => {
  const cart = useCart();

  const onRemove = () => {
    cart.removeItem(data.id, data.variationId);
  };

  return ( 
    <li className="flex py-6 border-b">
      <div className="relative h-24 w-24 rounded-md overflow-hidden sm:h-48 sm:w-48">
        <Image
          fill
          src={data.images[0].url}
          alt=""
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
        />
      </div>
      <div className="relative ml-4 flex flex-1 flex-col justify-between sm:ml-6">
        <div className="absolute z-10 right-0 top-0">
          <Button onClick={onRemove} variant="ghost">
            <X size={15} />
          </Button>
        </div>
        <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
          <div className="flex justify-between">
            <p className="text-lg font-semibold text-black">
              {data.name}
            </p>
          </div>

          <div className="mt-1 flex text-sm">
            <p className="text-gray-500">{data.selectedSize.name}</p>
            <p className="ml-4 border-l border-gray-200 pl-4 text-gray-500">
              {data.selectedColor.name}
            </p>
          </div>

          <div className="mt-1 flex items-center">
            <p className="text-gray-500">Quantity: {data.quantity}</p>
          </div>

          <div className="mt-1 flex items-end">
            <p className="text-xl font-semibold text-black">
              {formatter.format(data.price.toNumber() * data.quantity)}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}
 
export default CartItem;
