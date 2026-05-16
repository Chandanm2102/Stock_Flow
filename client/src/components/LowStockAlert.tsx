import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ProductWithCategory } from "@shared/schema";

interface LowStockAlertProps {
  products: ProductWithCategory[];
  isLoading?: boolean;
}

export function LowStockAlert({ products, isLoading }: LowStockAlertProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-3 rounded-md bg-muted">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted-foreground/20 rounded" />
                  <div className="h-3 w-20 bg-muted-foreground/20 rounded" />
                </div>
                <div className="h-6 w-12 bg-muted-foreground/20 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3 mb-3">
              <AlertTriangle className="h-6 w-6 text-green-600 dark:text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground">All products are well stocked</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          Low Stock Alerts
          <Badge variant="secondary" size="sm" className="ml-auto">
            {products.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px]">
          <div className="space-y-1 p-4 pt-0">
            {products.map((product) => {
              const isOutOfStock = product.quantity === 0;
              return (
                <div
                  key={product.id}
                  className={`flex items-center justify-between gap-4 p-3 rounded-md ${
                    isOutOfStock
                      ? "bg-red-50 dark:bg-red-900/20"
                      : "bg-yellow-50 dark:bg-yellow-900/20"
                  }`}
                  data-testid={`alert-product-${product.id}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isOutOfStock ? "destructive" : "secondary"}
                      size="sm"
                    >
                      {product.quantity} / {product.lowStockThreshold}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
