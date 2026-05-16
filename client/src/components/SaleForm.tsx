import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShoppingCart, Loader2, Package, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import { useState, useEffect } from "react";

const saleFormSchema = z.object({
  productId: z.coerce.number().min(1, "Please select a product"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Price must be a positive number",
  }),
});

type SaleFormValues = z.infer<typeof saleFormSchema>;

interface SaleFormProps {
  products: Product[];
  onSubmit: (data: SaleFormValues) => void;
  isPending?: boolean;
  isLoading?: boolean;
}

export function SaleForm({ products, onSubmit, isPending, isLoading }: SaleFormProps) {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [total, setTotal] = useState(0);
  const [scannerOpen, setScannerOpen] = useState(false);

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      productId: 0,
      quantity: 1,
      unitPrice: "0",
    },
  });

  const watchProductId = form.watch("productId");
  const watchQuantity = form.watch("quantity");
  const watchPrice = form.watch("unitPrice");

  useEffect(() => {
    if (watchProductId) {
      const product = products.find((p) => p.id === Number(watchProductId));
      if (product) {
        setSelectedProduct(product);
        form.setValue("unitPrice", product.sellingPrice.toString());
      }
    } else {
      setSelectedProduct(null);
    }
  }, [watchProductId, products, form]);

  useEffect(() => {
    const price = parseFloat(watchPrice) || 0;
    const qty = watchQuantity || 0;
    setTotal(price * qty);
  }, [watchPrice, watchQuantity]);

  const handleSubmit = (data: SaleFormValues) => {
    onSubmit(data);
    form.reset({
      productId: 0,
      quantity: 1,
      unitPrice: "0",
    });
    setSelectedProduct(null);
    setTotal(0);
  };

  const handleBarcodeScan = (barcode: string) => {
    const product = products.find(
      (p) => p.sku === barcode || p.name.toLowerCase().includes(barcode.toLowerCase())
    );
    
    if (product) {
      if (product.quantity > 0) {
        form.setValue("productId", product.id);
        setSelectedProduct(product);
        form.setValue("unitPrice", product.sellingPrice.toString());
        toast({
          title: "Product found",
          description: `${product.name} selected`,
        });
      } else {
        toast({
          title: "Out of stock",
          description: `${product.name} has no available stock`,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Product not found",
        description: `No product with barcode/SKU: ${barcode}`,
        variant: "destructive",
      });
    }
  };

  const availableProducts = products.filter((p) => p.quantity > 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="h-5 w-5" />
            Record Sale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-10 w-full bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShoppingCart className="h-5 w-5" />
              Record Sale
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScannerOpen(true)}
              data-testid="button-scan-barcode"
            >
              <ScanLine className="h-4 w-4 mr-2" />
              Scan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {availableProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No products available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add products to inventory before recording sales
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product *</FormLabel>
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(val) => field.onChange(parseInt(val))}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-sale-product">
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              <div className="flex items-center justify-between gap-4 w-full">
                                <span>{product.name}</span>
                                <span className="text-muted-foreground text-xs font-mono">
                                  ({product.quantity} in stock)
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedProduct && (
                  <div className="p-3 rounded-md bg-muted/50 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available:</span>
                      <span className="font-mono">{selectedProduct.quantity} units</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-muted-foreground">Unit price:</span>
                      <span className="font-mono">
                        ${Number(selectedProduct.sellingPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max={selectedProduct?.quantity || 999}
                            className="font-mono"
                            {...field}
                            data-testid="input-sale-quantity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              placeholder="0.00"
                              className="pl-7 font-mono"
                              {...field}
                              data-testid="input-sale-price"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="p-4 rounded-md bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Amount</span>
                    <span className="text-2xl font-bold font-mono">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending || !selectedProduct}
                  data-testid="button-record-sale"
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Record Sale
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleBarcodeScan}
      />
    </>
  );
}
