import { ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import type { SaleWithProduct } from "@shared/schema";

interface RecentSalesProps {
  sales: SaleWithProduct[];
  isLoading?: boolean;
}

export function RecentSales({ sales, isLoading }: RecentSalesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-5 w-5" />
            Recent Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-2">
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
                <div className="h-5 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sales.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-5 w-5" />
            Recent Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <ShoppingCart className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No sales recorded yet</p>
            <p className="text-xs text-muted-foreground mt-1">Sales will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="h-5 w-5" />
          Recent Sales
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px]">
          <div className="space-y-1 px-4 pb-4">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between gap-4 py-3 border-b last:border-0"
                data-testid={`sale-item-${sale.id}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {sale.product?.name || "Unknown Product"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sale.quantity} x ${Number(sale.unitPrice).toFixed(2)} •{" "}
                    {sale.saleDate
                      ? formatDistanceToNow(new Date(sale.saleDate), { addSuffix: true })
                      : "Just now"}
                  </p>
                </div>
                <p className="font-mono font-medium text-sm">
                  ${Number(sale.totalPrice).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
