import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Download, FileText } from "lucide-react";
import { InventoryTable } from "@/components/InventoryTable";
import { ProductForm } from "@/components/ProductForm";
import { CategoryForm } from "@/components/CategoryForm";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ProductWithCategory, Category } from "@shared/schema";

export default function Inventory() {
  const { toast } = useToast();
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);

  const { data: products = [], isLoading: productsLoading } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createProduct = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setProductFormOpen(false);
      toast({
        title: "Product created",
        description: "The product has been added to your inventory.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PATCH", `/api/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/low-stock"] });
      setProductFormOpen(false);
      setEditingProduct(null);
      toast({
        title: "Product updated",
        description: "The product has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/low-stock"] });
      toast({
        title: "Product deleted",
        description: "The product has been removed from your inventory.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createCategory = useMutation({
    mutationFn: async (data: { name: string }) => {
      return apiRequest("POST", "/api/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setCategoryFormOpen(false);
      toast({
        title: "Category created",
        description: "The category has been added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductFormOpen(true);
  };

  const handleEditProduct = (product: ProductWithCategory) => {
    setEditingProduct(product);
    setProductFormOpen(true);
  };

  const handleDeleteProduct = (productId: number) => {
    deleteProduct.mutate(productId);
  };

  const handleProductSubmit = (data: any) => {
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, data });
    } else {
      createProduct.mutate(data);
    }
  };

  useEffect(() => {
    if (!productFormOpen) {
      setEditingProduct(null);
    }
  }, [productFormOpen]);

  const outOfStockCount = products.filter(p => p.quantity === 0).length;
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= p.lowStockThreshold).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Products Inventory</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage and track your product catalog.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCategoryFormOpen(true)}
            data-testid="button-add-category"
          >
            <Plus className="h-4 w-4 mr-2" />
            Category
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="button-export-inventory">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => window.open("/api/export/inventory/csv", "_blank")}
                data-testid="button-export-csv"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open("/api/export/inventory/pdf", "_blank")}
                data-testid="button-export-pdf"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Products</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">{products.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Low Stock</p>
          <p className="text-2xl font-bold text-orange-500 font-mono">{lowStockCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Out of Stock</p>
          <p className="text-2xl font-bold text-red-500 font-mono">{outOfStockCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Categories</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">{categories.length}</p>
        </div>
      </div>

      <InventoryTable
        products={products}
        isLoading={productsLoading}
        onAdd={handleAddProduct}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
      />

      <ProductForm
        open={productFormOpen}
        onOpenChange={setProductFormOpen}
        product={editingProduct}
        categories={categories}
        onSubmit={handleProductSubmit}
        isPending={createProduct.isPending || updateProduct.isPending}
      />

      <CategoryForm
        open={categoryFormOpen}
        onOpenChange={setCategoryFormOpen}
        onSubmit={(data) => createCategory.mutate(data)}
        isPending={createCategory.isPending}
      />
    </div>
  );
}
