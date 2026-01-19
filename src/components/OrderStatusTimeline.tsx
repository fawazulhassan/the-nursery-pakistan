import { CheckCircle, Circle, Package, Truck, MapPin, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderStatusTimelineProps {
  status: string;
}

const ORDER_STATUSES = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'processing', label: 'Processing', icon: Circle },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: MapPin },
];

const getStatusIndex = (status: string) => {
  if (status === 'cancelled') return -1;
  return ORDER_STATUSES.findIndex(s => s.key === status);
};

const OrderStatusTimeline = ({ status }: OrderStatusTimelineProps) => {
  const currentIndex = getStatusIndex(status);
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <XCircle className="h-6 w-6 text-destructive" />
        <div>
          <p className="font-medium text-destructive">Order Cancelled</p>
          <p className="text-sm text-muted-foreground">This order has been cancelled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-muted -z-10" />
        <div 
          className="absolute left-0 top-5 h-0.5 bg-primary -z-10 transition-all duration-500"
          style={{ 
            width: `${currentIndex >= 0 ? (currentIndex / (ORDER_STATUSES.length - 1)) * 100 : 0}%` 
          }}
        />
        
        {ORDER_STATUSES.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div key={step.key} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  isCompleted 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground",
                  isCurrent && "ring-4 ring-primary/20"
                )}
              >
                {isCompleted && index < currentIndex ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span 
                className={cn(
                  "text-xs font-medium text-center",
                  isCompleted ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusTimeline;
