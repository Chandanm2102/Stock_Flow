import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Package, Edit, Download } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductWithCategory } from "@shared/schema";

export default function LowStock() {
  const { data: products = [], isLoading } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products/low-stock"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Low Stock Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Products that need restocking
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const outOfStock = products.filter((p) => p.quantity === 0);
  const lowStock = products.filter((p) => p.quantity > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Low Stock Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Products that need restocking
          </p>
        </div>
        {products.length > 0 && (
          <Button
            variant="outline"
            onClick={() => window.open("/api/export/low-stock/csv", "_blank")}
            data-testid="button-export-low-stock"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 mb-4">
              <AlertTriangle className="h-8 w-8 text-green-600 dark:text-green-500" />
            </div>
            <h2 className="text-xl font-medium mb-2">All Products Well Stocked</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Great news! All your products are above their low stock thresholds.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {outOfStock.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                Out of Stock ({outOfStock.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {outOfStock.map((product) => (
                  <Card
                    key={product.id}
                    className="border-red-200 dark:border-red-900/50"
                    data-testid={`card-out-of-stock-${product.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">
                            {product.name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            {product.sku}
                          </p>
                        </div>
                        <Badge variant="destructive" size="sm">
                          Out of Stock
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-muted-foreground">Category</span>
                        <span>{product.category?.name || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mb-4">
                        <span className="text-muted-foreground">Alert threshold</span>
                        <span className="font-mono">{product.lowStockThreshold} units</span>
                      </div>
                      <Link href="/inventory">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Update Stock
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {lowStock.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-yellow-500" />
                Low Stock ({lowStock.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {lowStock.map((product) => (
                  <Card
                    key={product.id}
                    className="border-yellow-200 dark:border-yellow-900/50"
                    data-testid={`card-low-stock-${product.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">
                            {product.name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            {product.sku}
                          </p>
                        </div>
                        <Badge
                          size="sm"
                          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500"
                        >
                          {product.quantity} left
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-muted-foreground">Category</span>
                        <span>{product.category?.name || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mb-4">
                        <span className="text-muted-foreground">Alert threshold</span>
                        <span className="font-mono">{product.lowStockThreshold} units</span>
                      </div>
                      <Link href="/inventory">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Update Stock
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
