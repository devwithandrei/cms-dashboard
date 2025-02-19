'use client';

import { useState } from 'react';
import { Trash, Plus } from 'lucide-react';
import { Size, Color } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface ProductVariation {
  sizeId?: string;
  colorId?: string;
  stock: number;
}

interface ProductVariationsFormProps {
  sizes: Size[];
  colors: Color[];
  existingVariations?: ProductVariation[];
  onVariationsChangeAction: (variations: ProductVariation[]) => void;
  onRemoveVariationAction: (index: number) => void;
}

export const ProductVariationsForm: React.FC<ProductVariationsFormProps> = ({
  sizes,
  colors,
  existingVariations = [],
  onVariationsChangeAction,
  onRemoveVariationAction,
}) => {
  const [variations, setVariations] = useState<ProductVariation[]>(existingVariations);

  const addVariation = () => {
    setVariations(prev => [
      ...prev,
      { sizeId: undefined, colorId: undefined, stock: 0 }
    ]);
    onVariationsChangeAction([...variations, { sizeId: undefined, colorId: undefined, stock: 0 }]);
  };

  const updateVariation = (index: number, field: keyof ProductVariation, value: string | number | undefined) => {
    const updatedVariations = variations.map((variation, i) => {
      if (i === index) {
        return {
          ...variation,
          [field]: value
        };
      }
      return variation;
    });
    
    setVariations(updatedVariations);
    onVariationsChangeAction(updatedVariations);
  };

  const removeVariation = (index: number) => {
    const updatedVariations = variations.filter((_, i) => i !== index);
    setVariations(updatedVariations);
    onVariationsChangeAction(updatedVariations);
    
    // If all variations are removed, call the action if needed
    if (updatedVariations.length === 0) {
      // Optionally call a function here to handle the removal of all variations
      // onAllVariationsRemovedAction(); // Uncomment if needed
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Product Variations</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addVariation}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Variation
        </Button>
      </div>
      <div className="space-y-4">
        {variations.map((variation, index) => (
          <Card key={index} className="p-4">
            <div className="grid grid-cols-4 gap-4">
              {sizes.length > 0 && (
                <div className="col-span-1">
                  <Label>Size (Optional)</Label>
                  <Select
                    value={variation.sizeId || ''}
                    onValueChange={(value) => updateVariation(index, 'sizeId', value === '' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No size</SelectItem>
                      {sizes.map((size) => (
                        <SelectItem key={size.id} value={size.id}>
                          {size.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {colors.length > 0 && (
                <div className="col-span-1">
                  <Label>Color (Optional)</Label>
                  <Select
                    value={variation.colorId || ''}
                    onValueChange={(value) => updateVariation(index, 'colorId', value === '' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No color</SelectItem>
                      {colors.map((color) => (
                        <SelectItem key={color.id} value={color.id}>
                          {color.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="col-span-1">
                <Label>Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={variation.stock}
                  onChange={(e) => updateVariation(index, 'stock', parseInt(e.target.value, 10))}
                />
              </div>
              <div className="col-span-1 flex items-end">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeVariation(index)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductVariationsForm;