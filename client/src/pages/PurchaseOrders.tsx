import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Plus, 
  Eye, 
  Trash2, 
  ClipboardList, 
  Package,
  Calendar,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import type { PurchaseOrderWithSupplier, Supplier } from "@shared/schema";
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

const orderFormSchema = z.object({
  supplierId: z.number({ required_error: "Please select a supplier" }),
  orderNumber: z.string().min(1, "Order number is required"),
  status: z.string().optional(),
  notes: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

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

export default function PurchaseOrders() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOrder, setDeleteOrder] = useState<PurchaseOrderWithSupplier | null>(null);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      supplierId: undefined,
      orderNumber: "",
      status: "pending",
      notes: "",
    },
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<PurchaseOrderWithSupplier[]>({
    queryKey: ["/api/purchase-orders"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const createOrder = useMutation({
    mutationFn: async (data: OrderFormValues) => {
      return apiRequest("POST", "/api/purchase-orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      setFormOpen(false);
      form.reset();
      toast({
        title: "Order created",
        description: "The purchase order has been created. Add items to it now.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/purchase-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      setDeleteOrder(null);
      toast({
        title: "Order deleted",
        description: "The purchase order has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete order.",
        variant: "destructive",
      });
    },
  });

  const handleOpenForm = () => {
    form.reset({
      supplierId: undefined,
      orderNumber: `PO-${Date.now()}`,
      status: "pending",
      notes: "",
    });
    setFormOpen(true);
  };

  const onSubmit = (data: OrderFormValues) => {
    createOrder.mutate(data);
  };

  if (ordersLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            <h1 className="text-2xl font-semibold">Purchase Orders</h1>
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          <h1 className="text-2xl font-semibold">Purchase Orders</h1>
          <Badge variant="secondary">
            {orders.length}
          </Badge>
        </div>
        <Button 
          onClick={handleOpenForm} 
          disabled={suppliers.length === 0}
          data-testid="button-add-order"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>

      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">No suppliers yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add suppliers first before creating purchase orders
            </p>
            <Button asChild className="mt-4">
              <Link href="/suppliers" data-testid="link-add-suppliers">
                Go to Suppliers
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">No purchase orders yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first purchase order to track incoming inventory
            </p>
            <Button onClick={handleOpenForm} className="mt-4" data-testid="button-add-first-order">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                      <TableCell className="font-mono text-sm">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        {order.supplier?.name || "Unknown Supplier"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {order.orderDate
                          ? format(new Date(order.orderDate), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${Number(order.totalAmount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusBadgeVariant(order.status)}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            asChild
                          >
                            <Link 
                              href={`/purchase-orders/${order.id}`}
                              data-testid={`button-view-order-${order.id}`}
                              aria-label="View order details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteOrder(order)}
                            data-testid={`button-delete-order-${order.id}`}
                            aria-label="Delete order"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
            <DialogDescription>
              Create a new purchase order. You can add items after creating it.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-supplier">
                          <SelectValue placeholder="Select a supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem
                            key={supplier.id}
                            value={supplier.id.toString()}
                          >
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Number *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="PO-001"
                        {...field}
                        data-testid="input-order-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes..."
                        {...field}
                        value={field.value || ""}
                        data-testid="input-order-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                  data-testid="button-cancel-order"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createOrder.isPending}
                  data-testid="button-save-order"
                >
                  {createOrder.isPending ? "Creating..." : "Create Order"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteOrder} onOpenChange={() => setDeleteOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order "{deleteOrder?.orderNumber}"? This will
              also delete all items in this order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-order">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteOrder) {
                  deleteOrderMutation.mutate(deleteOrder.id);
                }
              }}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete-order"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
