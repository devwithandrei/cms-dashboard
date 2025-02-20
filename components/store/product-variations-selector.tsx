'use client';

import { useState } from 'react';
import { Size, Color, ProductSize, ProductColor } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ProductVariationsSelectorProps {
  productSizes: (ProductSize & { size: Size })[];
  productColors: (ProductColor & { color: Color })[];
  onSelect: (variation: { size?: Size; color?: Color }) => void;
}

export const ProductVariationsSelector: React.FC<ProductVariationsSelectorProps> = ({
  productSizes,
  productColors,
  onSelect,
}) => {
  const [selectedSizeId, setSelectedSizeId] = useState<string>('');
  const [selectedColorId, setSelectedColorId] = useState<string>('');

  const handleSizeChange = (sizeId: string) => {
    setSelectedSizeId(sizeId);
    const size = productSizes.find(ps => ps.size.id === sizeId)?.size;
    onSelect({ 
      size,
      color: productColors.find(pc => pc.color.id === selectedColorId)?.color 
    });
  };

  const handleColorChange = (colorId: string) => {
    setSelectedColorId(colorId);
    const color = productColors.find(pc => pc.color.id === colorId)?.color;
    onSelect({ 
      size: productSizes.find(ps => ps.size.id === selectedSizeId)?.size,
      color 
    });
  };

  return (
    <div className="space-y-4">
      {productSizes.length > 0 && (
        <div className="space-y-2">
          <Label>Size</Label>
          <Select
            value={selectedSizeId}
            onValueChange={handleSizeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a size" />
            </SelectTrigger>
            <SelectContent>
              {productSizes.map((ps) => (
                <SelectItem key={ps.size.id} value={ps.size.id}>
                  {ps.size.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {productColors.length > 0 && (
        <div className="space-y-2">
          <Label>Color</Label>
          <Select
            value={selectedColorId}
            onValueChange={handleColorChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a color" />
            </SelectTrigger>
            <SelectContent>
              {productColors.map((pc) => (
                <SelectItem key={pc.color.id} value={pc.color.id}>
                  {pc.color.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
