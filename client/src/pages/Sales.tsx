import { useQuery, useMutation } from "@tanstack/react-query";
import { SaleForm } from "@/components/SaleForm";
import { RecentSales } from "@/components/RecentSales";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Product, SaleWithProduct } from "@shared/schema";

export default function Sales() {
  const { toast } = useToast();

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: recentSales = [], isLoading: salesLoading } = useQuery<SaleWithProduct[]>({
    queryKey: ["/api/sales/recent"],
  });

  const createSale = useMutation({
    mutationFn: async (data: { productId: number; quantity: number; unitPrice: string }) => {
      return apiRequest("POST", "/api/sales", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Sale recorded",
        description: "The sale has been recorded and inventory updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record sale. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">Record Sale</h1>
        <p className="text-muted-foreground mt-1">
          Record a new sale and automatically update inventory
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SaleForm
          products={products}
          onSubmit={createSale.mutate}
          isPending={createSale.isPending}
          isLoading={productsLoading}
        />
        <RecentSales sales={recentSales} isLoading={salesLoading} />
      </div>
    </div>
  );
}
