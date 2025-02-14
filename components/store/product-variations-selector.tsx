'use client';

import { useState, useEffect } from 'react';
import { Size, Color } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ProductVariation {
  sizeId: string;
  colorId: string;
  stock: number;
  size: Size;
  color: Color;
}

interface ProductVariationsSelectorProps {
  variations: ProductVariation[];
  onVariationSelect: (variation: ProductVariation | null) => void;
}

export const ProductVariationsSelector: React.FC<ProductVariationsSelectorProps> = ({
  variations,
  onVariationSelect,
}) => {
  const [selectedSizeId, setSelectedSizeId] = useState<string>('');
  const [selectedColorId, setSelectedColorId] = useState<string>('');
  const [availableColors, setAvailableColors] = useState<Color[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);

  // Get unique sizes from variations
  const uniqueSizes = Array.from(new Set(variations.map(v => v.size.id))).map(
    sizeId => variations.find(v => v.size.id === sizeId)?.size
  ).filter((size): size is Size => size !== undefined);

  // Update available colors when size is selected
  useEffect(() => {
    if (selectedSizeId) {
      const colors = variations
        .filter(v => v.sizeId === selectedSizeId && v.stock > 0)
        .map(v => v.color);
      setAvailableColors(colors);
      setSelectedColorId('');
      setSelectedVariation(null);
      onVariationSelect(null);
    } else {
      setAvailableColors([]);
      setSelectedColorId('');
      setSelectedVariation(null);
      onVariationSelect(null);
    }
  }, [selectedSizeId, variations]);

  // Update selected variation when both size and color are selected
  useEffect(() => {
    if (selectedSizeId && selectedColorId) {
      const variation = variations.find(
        v => v.sizeId === selectedSizeId && v.colorId === selectedColorId
      );
      setSelectedVariation(variation || null);
      onVariationSelect(variation || null);
    }
  }, [selectedSizeId, selectedColorId, variations]);

  return (
    <div className="space-y-4">
      <div>
        <Label>Size</Label>
        <Select
          value={selectedSizeId}
          onValueChange={setSelectedSizeId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            {uniqueSizes.map((size) => (
              <SelectItem key={size.id} value={size.id}>
                {size.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSizeId && (
        <div>
          <Label>Color</Label>
          <Select
            value={selectedColorId}
            onValueChange={setSelectedColorId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              {availableColors.map((color) => (
                <SelectItem key={color.id} value={color.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: color.value }}
                    />
                    {color.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedVariation && (
        <div className="text-sm text-muted-foreground">
          {selectedVariation.stock} items in stock
        </div>
      )}
    </div>
  );
};

export default ProductVariationsSelector;
