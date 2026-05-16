import { useState } from "react";
import { Edit, Trash2, Search, Plus, Package, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useToast } from "@/hooks/use-toast";
import type { ProductWithCategory } from "@shared/schema";

interface InventoryTableProps {
  products: ProductWithCategory[];
  isLoading?: boolean;
  onEdit: (product: ProductWithCategory) => void;
  onDelete: (productId: number) => void;
  onAdd: () => void;
}

function getStockStatus(quantity: number, threshold: number) {
  if (quantity === 0) return {
    label: "Out of Stock",
    variant: "destructive" as const,
    dotClass: "bg-red-600 dark:bg-red-400",
    pillClass: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10",
  };
  if (quantity <= threshold) return {
    label: "Low Stock",
    variant: "secondary" as const,
    dotClass: "bg-orange-600 dark:bg-orange-400",
    pillClass: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-400/10",
  };
  return {
    label: "In Stock",
    variant: "default" as const,
    dotClass: "bg-green-600 dark:bg-green-400",
    pillClass: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-400/10",
  };
}

export function InventoryTable({
  products,
  isLoading,
  onEdit,
  onDelete,
  onAdd,
}: InventoryTableProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteProduct, setDeleteProduct] = useState<ProductWithCategory | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleBarcodeScan = (barcode: string) => {
    const product = products.find(
      (p) => p.sku === barcode || p.name.toLowerCase().includes(barcode.toLowerCase())
    );
    
    if (product) {
      setSearchQuery(barcode);
      toast({
        title: "Product found",
        description: `Found: ${product.name}`,
      });
    } else {
      toast({
        title: "Product not found",
        description: `No product with barcode/SKU: ${barcode}`,
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Package className="h-5 w-5" />
            Inventory
          </CardTitle>
          <Skeleton className="h-9 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-sm" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Package className="h-5 w-5" />
            Inventory
            <Badge variant="secondary" size="sm">
              {products.length}
            </Badge>
          </CardTitle>
          <Button onClick={onAdd} data-testid="button-add-product">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 max-w-md">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-products"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setScannerOpen(true)}
                data-testid="button-scan-inventory"
              >
                <ScanLine className="h-4 w-4 mr-2" />
                Scan
              </Button>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">
                  {searchQuery ? "No products found" : "No products yet"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery
                    ? "Try a different search term"
                    : "Add your first product to get started"}
                </p>
                {!searchQuery && (
                  <Button onClick={onAdd} className="mt-4" data-testid="button-add-first-product">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="hidden sm:table-cell">Category</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Cost</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="hidden lg:table-cell">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        const status = getStockStatus(product.quantity, product.lowStockThreshold);
                        return (
                          <TableRow
                            key={product.id}
                            data-testid={`row-product-${product.id}`}
                          >
                            <TableCell>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {product.sku}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {product.category?.name || (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {product.quantity}
                            </TableCell>
                            <TableCell className="text-right font-mono hidden md:table-cell">
                              ${Number(product.costPrice).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ${Number(product.sellingPrice).toFixed(2)}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full w-fit ${status.pillClass}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                                  {status.label}
                                </span>
                                <span className="text-xs text-muted-foreground">{product.quantity} units</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => onEdit(product)}
                                  data-testid={`button-edit-product-${product.id}`}
                                  aria-label="Edit product"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setDeleteProduct(product)}
                                  data-testid={`button-delete-product-${product.id}`}
                                  aria-label="Delete product"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProduct?.name}"? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteProduct) {
                  onDelete(deleteProduct.id);
                  setDeleteProduct(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleBarcodeScan}
      />
    </>
  );
}
