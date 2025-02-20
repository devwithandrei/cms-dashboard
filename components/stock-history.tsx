'use client';

import { useState } from 'react';
import { format } from 'date-fns';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

interface StockHistoryProps {
  initialHistory: {
    id: string;
    oldStock: number;
    newStock: number;
    changeType: string;
    reason: string | null;
    createdAt: Date;
    createdBy: string;
  }[];
}

export const StockHistory: React.FC<StockHistoryProps> = ({
  initialHistory = []
}) => {
  const [history, setHistory] = useState(initialHistory);
  const [changeType, setChangeType] = useState<string>('');
  const [date, setDate] = useState<Date>();

  const filteredHistory = history.filter((item) => {
    if (changeType && item.changeType !== changeType) return false;
    if (date && format(item.createdAt, 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd')) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Stock History</h2>
        <div className="flex items-center gap-x-2">
          <Select
            value={changeType}
            onValueChange={setChangeType}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="order">Order</SelectItem>
              <SelectItem value="return">Return</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date: Date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                fromMonth={new Date("1900-01-01")}
                toMonth={new Date()}
              />
            </PopoverContent>
          </Popover>
          {date && (
            <Button
              variant="ghost"
              onClick={() => setDate(undefined)}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Old Stock</TableHead>
            <TableHead>New Stock</TableHead>
            <TableHead>Change</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Updated By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredHistory.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No stock history found.
              </TableCell>
            </TableRow>
          ) : (
            filteredHistory.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {format(new Date(item.createdAt), 'MMM d, yyyy HH:mm')}
                </TableCell>
                <TableCell className="capitalize">{item.changeType}</TableCell>
                <TableCell>{item.oldStock}</TableCell>
                <TableCell>{item.newStock}</TableCell>
                <TableCell className={cn(
                  "font-medium",
                  item.newStock > item.oldStock ? "text-green-600" : "text-red-600"
                )}>
                  {item.newStock > item.oldStock ? '+' : ''}{item.newStock - item.oldStock}
                </TableCell>
                <TableCell>{item.reason || '-'}</TableCell>
                <TableCell>{item.createdBy}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default StockHistory;
