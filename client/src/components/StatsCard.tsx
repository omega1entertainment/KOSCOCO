import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export default function StatsCard({ icon: Icon, label, value, trend }: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        {trend && (
          <span 
            className={`text-sm font-semibold ${trend.positive ? 'text-green-600' : 'text-red-600'}`}
            data-testid="text-trend"
          >
            {trend.positive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1" data-testid="text-label">
          {label}
        </p>
        <p className="text-3xl font-bold" data-testid="text-value">
          {value}
        </p>
      </div>
    </Card>
  );
}
