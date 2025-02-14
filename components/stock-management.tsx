'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

interface StockManagementProps {
  initialVariations: {
    id: string;
    size: { id: string; name: string };
    color: { id: string; name: string };
    stock: number;
  }[];
  productId: string;
  storeId: string;
  userId: string;
}

export const StockManagement: React.FC<StockManagementProps> = ({
  initialVariations,
  productId,
  storeId,
  userId
}) => {
  const [variations, setVariations] = useState(initialVariations);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const onStockChange = (variationId: string, newStock: number) => {
    setVariations(current => 
      current.map(variation => 
        variation.id === variationId 
          ? { ...variation, stock: newStock }
          : variation
      )
    );
  };

  const onSave = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for the stock change');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/${storeId}/products/${productId}/variations`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          variations,
          reason,
          userId,
          changeType: 'manual'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stock');
      }

      toast.success('Stock updated successfully');
      setReason('');
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Stock Management</h2>
        <Button onClick={onSave} disabled={loading || !reason.trim()}>
          Save Changes
        </Button>
      </div>

      <div className="space-y-4">
        <Textarea
          placeholder="Reason for stock change (required)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Size</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Current Stock</TableHead>
            <TableHead>New Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variations.map((variation) => (
            <TableRow key={variation.id}>
              <TableCell>{variation.size?.name || 'N/A'}</TableCell>
              <TableCell>{variation.color?.name || 'N/A'}</TableCell>
              <TableCell>{variation.stock}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  value={variation.stock}
                  onChange={(e) => onStockChange(variation.id, parseInt(e.target.value, 10))}
                  className="w-24"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default StockManagement;
