import { useState } from "react";
import { OrderStatus } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import { toast } from "react-hot-toast";

interface OrderStatusCellProps {
  initialStatus: OrderStatus;
  orderId: string;
}

const statusColorMap: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "bg-yellow-500/20 text-yellow-700",
  [OrderStatus.PAID]: "bg-blue-500/20 text-blue-700",
  [OrderStatus.SHIPPED]: "bg-purple-500/20 text-purple-700",
  [OrderStatus.DELIVERED]: "bg-green-500/20 text-green-700",
  [OrderStatus.CANCELLED]: "bg-red-500/20 text-red-700",
};

export const OrderStatusCell = ({
  initialStatus,
  orderId,
}: OrderStatusCellProps) => {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  const onStatusChange = async (newStatus: OrderStatus) => {
    try {
      setIsLoading(true);
      await axios.patch(`/api/orders/${orderId}`, { status: newStatus });
      setStatus(newStatus);
      toast.success("Order status updated");
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-x-2">
      <Select
        disabled={isLoading}
        value={status}
        onValueChange={(value: OrderStatus) => onStatusChange(value)}
      >
        <SelectTrigger className={`w-[180px] ${statusColorMap[status]}`}>
          <SelectValue defaultValue={status} />
        </SelectTrigger>
        <SelectContent>
          {Object.values(OrderStatus).map((status) => (
            <SelectItem
              key={status}
              value={status}
              className={statusColorMap[status]}
            >
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
