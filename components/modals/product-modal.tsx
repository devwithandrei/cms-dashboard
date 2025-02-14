'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Product, ProductSize, ProductColor, Size, Color } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductVariationsSelector } from '@/components/store/product-variations-selector';
import { useCart } from '@/hooks/use-cart';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { formatter } from '@/lib/utils';

interface ProductModalProps {
  product: Product & {
    description?: { name: string; value: string };
    productSizes: (ProductSize & { size: Size })[];
    productColors: (ProductColor & { color: Color })[];
  };
  isOpen: boolean;
  onCloseAction: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onCloseAction: onClose,
}) => {
  const router = useRouter();
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);

  const onAddToCart = () => {
    if (!selectedVariation) {
      toast.error('Please select size and color');
      return;
    }

    if (quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    if (quantity > selectedVariation.stock) {
      toast.error('Not enough items in stock');
      return;
    }

    cart.addItem({
      ...product,
      quantity,
      selectedSize: selectedVariation.size,
      selectedColor: selectedVariation.color,
      variationId: selectedVariation.id,
    });

    toast.success('Added to cart.');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            {product.description?.value}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              {product.images?.[0] && (
                <div className="aspect-square relative h-full w-full overflow-hidden rounded-lg">
                  <Image
                    fill
                    src={product.images[0].url}
                    alt={product.name}
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 400px"
                    priority
                  />
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="text-2xl font-bold">
                {formatter.format(product.price.toNumber())}
              </div>
              <ProductVariationsSelector
                variations={product.productSizes.map((ps, index) => ({
                  sizeId: ps.sizeId,
                  colorId: product.productColors[index]?.colorId || '',
                  stock: ps.stock,
                  size: ps.size,
                  color: product.productColors[index]?.color || { id: '', name: 'N/A', value: '', createdAt: new Date(), updatedAt: new Date() }
                }))}
                onVariationSelect={setSelectedVariation}
              />
              <div>
                <Input
                  type="number"
                  min="1"
                  max={selectedVariation?.stock || 1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                  placeholder="Quantity"
                />
              </div>
              <Button
                onClick={onAddToCart}
                className="w-full"
                disabled={!selectedVariation}
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
