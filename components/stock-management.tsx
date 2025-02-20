'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

interface StockManagementProps {
  currentStock: number;
  productId: string;
  storeId: string;
  userId: string;
}

export const StockManagement: React.FC<StockManagementProps> = ({
  currentStock,
  productId,
  storeId,
  userId
}) => {
  const [newStock, setNewStock] = useState(currentStock);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const onSave = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for the stock change');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/${storeId}/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          newStock,
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
        <Button onClick={onSave} disabled={loading || !reason.trim() || newStock === currentStock}>
          Save Changes
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Current Stock</label>
              <div className="mt-1 text-2xl font-semibold">{currentStock}</div>
            </div>
            <div>
              <label className="text-sm font-medium">New Stock</label>
              <Input
                type="number"
                min="0"
                value={newStock}
                onChange={(e) => setNewStock(parseInt(e.target.value, 10))}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="text-sm font-medium">Reason for Change</label>
            <Textarea
              placeholder="Reason for stock change (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockManagement;
