import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "warning" | "success" | "danger";
  testId?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  testId,
}: StatsCardProps) {
  const variantStyles = {
    default: "text-foreground",
    warning: "text-yellow-600 dark:text-yellow-500",
    success: "text-green-600 dark:text-green-500",
    danger: "text-red-600 dark:text-red-500",
  };

  const iconBgStyles = {
    default: "bg-muted",
    warning: "bg-yellow-100 dark:bg-yellow-900/30",
    success: "bg-green-100 dark:bg-green-900/30",
    danger: "bg-red-100 dark:bg-red-900/30",
  };

  return (
    <Card data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-3xl font-bold font-mono ${variantStyles[variant]}`}>
              {value}
            </p>
            {trend && (
              <p
                className={`text-xs ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? "+" : "-"}
                {Math.abs(trend.value)}% from yesterday
              </p>
            )}
          </div>
          <div className={`p-3 rounded-md ${iconBgStyles[variant]}`}>
            <Icon className={`h-5 w-5 ${variantStyles[variant]}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
