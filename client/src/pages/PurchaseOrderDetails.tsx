import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { 
  ArrowLeft,
  Plus, 
  Trash2, 
  Package,
  CheckCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { PurchaseOrderFull, ProductWithCategory } from "@shared/schema";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { format } from "date-fns";

const itemFormSchema = z.object({
  productId: z.number({ required_error: "Please select a product" }),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitCost: z.string().min(1, "Unit cost is required"),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "received":
      return "default";
    case "partial":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

export default function PurchaseOrderDetails() {
  const { toast } = useToast();
  const [, params] = useRoute("/purchase-orders/:id");
  const orderId = params?.id ? parseInt(params.id) : null;
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [receivingMode, setReceivingMode] = useState(false);
  const [receivedQuantities, setReceivedQuantities] = useState<Record<number, number>>({});

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      productId: undefined,
      quantity: 1,
      unitCost: "",
    },
  });

  const { data: order, isLoading } = useQuery<PurchaseOrderFull>({
    queryKey: ["/api/purchase-orders", orderId],
    enabled: !!orderId,
  });

  const { data: products = [] } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const addItem = useMutation({
    mutationFn: async (data: ItemFormValues) => {
      const totalCost = (parseFloat(data.unitCost) * data.quantity).toString();
      return apiRequest("POST", `/api/purchase-orders/${orderId}/items`, {
        ...data,
        totalCost,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders", orderId] });
      setAddItemOpen(false);
      form.reset();
      toast({
        title: "Item added",
        description: "The item has been added to the order.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest("DELETE", `/api/purchase-order-items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders", orderId] });
      toast({
        title: "Item removed",
        description: "The item has been removed from the order.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove item.",
        variant: "destructive",
      });
    },
  });

  const receiveOrder = useMutation({
    mutationFn: async () => {
      const items = Object.entries(receivedQuantities).map(([itemId, qty]) => ({
        itemId: parseInt(itemId),
        receivedQty: qty,
      }));
      return apiRequest("POST", `/api/purchase-orders/${orderId}/receive`, { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders", orderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setReceivingMode(false);
      setReceivedQuantities({});
      toast({
        title: "Order received",
        description: "Stock has been updated with received quantities.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to receive order.",
        variant: "destructive",
      });
    },
  });

  const handleOpenAddItem = () => {
    form.reset({
      productId: undefined,
      quantity: 1,
      unitCost: "",
    });
    setAddItemOpen(true);
  };

  const handleStartReceiving = () => {
    const initial: Record<number, number> = {};
    order?.items?.forEach((item) => {
      initial[item.id] = item.receivedQuantity;
    });
    setReceivedQuantities(initial);
    setReceivingMode(true);
  };

  const onSubmit = (data: ItemFormValues) => {
    addItem.mutate(data);
  };

  if (isLoading || !orderId) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/purchase-orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium">Order not found</p>
            <p className="text-sm text-muted-foreground mt-1">
              This purchase order may have been deleted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/purchase-orders" aria-label="Back to orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold font-mono">{order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {order.supplier?.name || "Unknown Supplier"}
            </p>
          </div>
          <Badge variant={getStatusBadgeVariant(order.status)}>
            {order.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          {!receivingMode && order.status !== "received" && (
            <>
              <Button variant="outline" onClick={handleOpenAddItem} data-testid="button-add-item">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
              <Button onClick={handleStartReceiving} data-testid="button-start-receiving">
                <CheckCircle className="h-4 w-4 mr-2" />
                Receive Items
              </Button>
            </>
          )}
          {receivingMode && (
            <>
              <Button variant="outline" onClick={() => setReceivingMode(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => receiveOrder.mutate()}
                disabled={receiveOrder.isPending}
                data-testid="button-confirm-receive"
              >
                {receiveOrder.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Confirm Receipt
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Order Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {order.orderDate ? format(new Date(order.orderDate), "MMM d, yyyy") : "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium font-mono">
              ${Number(order.totalAmount || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {order.items?.length || 0} items
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {order.items?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No items yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add items to this purchase order
              </p>
              <Button onClick={handleOpenAddItem} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    {receivingMode && (
                      <TableHead className="text-right">Received</TableHead>
                    )}
                    {!receivingMode && (
                      <TableHead className="text-right">Received</TableHead>
                    )}
                    {!receivingMode && order.status !== "received" && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item) => (
                    <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                      <TableCell>
                        {item.product?.name || "Unknown Product"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${Number(item.unitCost || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${Number(item.totalCost || 0).toFixed(2)}
                      </TableCell>
                      {receivingMode ? (
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min={0}
                            max={item.quantity}
                            value={receivedQuantities[item.id] || 0}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setReceivedQuantities((prev) => ({
                                ...prev,
                                [item.id]: Math.min(val, item.quantity),
                              }));
                            }}
                            className="w-20 text-right font-mono"
                            data-testid={`input-received-qty-${item.id}`}
                          />
                        </TableCell>
                      ) : (
                        <TableCell className="text-right font-mono">
                          {item.receivedQuantity} / {item.quantity}
                        </TableCell>
                      )}
                      {!receivingMode && order.status !== "received" && (
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteItem.mutate(item.id)}
                            data-testid={`button-delete-item-${item.id}`}
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Item</DialogTitle>
            <DialogDescription>
              Add a product to this purchase order.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-product">
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem
                            key={product.id}
                            value={product.id.toString()}
                          >
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-item-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unitCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="0.00"
                          {...field}
                          data-testid="input-item-unit-cost"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddItemOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addItem.isPending}
                  data-testid="button-save-item"
                >
                  {addItem.isPending ? "Adding..." : "Add Item"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
