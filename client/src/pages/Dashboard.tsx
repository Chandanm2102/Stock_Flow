import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  ChevronRight,
  TrendingUp,
  Truck,
  ShoppingBag,
  ClipboardEdit,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { DashboardStats, ProductWithCategory, SaleWithProduct } from "@shared/schema";

function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  badge,
  badgeColor,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className={`h-10 w-10 ${iconBg} ${iconColor} rounded-lg flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
        {badge && (
          <span className={`text-xs font-bold px-2 py-1 rounded ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">{value}</h3>
    </div>
  );
}

function getStockStatus(product: ProductWithCategory) {
  if (product.quantity === 0) return { label: "OUT OF STOCK", className: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" };
  if (product.quantity <= product.lowStockThreshold) return { label: "LOW STOCK", className: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" };
  return { label: "IN STOCK", className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" };
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const { data: recentSales = [], isLoading: salesLoading } = useQuery<SaleWithProduct[]>({
    queryKey: ["/api/sales/recent"],
  });

  const topProducts = products.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">System Overview</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track your inventory and sales performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <Skeleton className="h-10 w-10 rounded-lg mb-4" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              title="Total Products"
              value={stats?.totalProducts ?? 0}
              icon={Package}
              iconBg="bg-blue-100 dark:bg-blue-900/30"
              iconColor="text-blue-600 dark:text-blue-400"
              badge="+0%"
              badgeColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400"
            />
            <StatCard
              title="Today's Revenue"
              value={`$${(stats?.todaySales ?? 0).toFixed(2)}`}
              icon={DollarSign}
              iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              iconColor="text-emerald-600 dark:text-emerald-400"
              badge="+0%"
              badgeColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400"
            />
            <StatCard
              title="Low Stock Items"
              value={stats?.lowStockCount ?? 0}
              icon={AlertTriangle}
              iconBg="bg-rose-100 dark:bg-rose-900/30"
              iconColor="text-rose-600 dark:text-rose-400"
              badge={stats?.lowStockCount ? "Alert" : "OK"}
              badgeColor={stats?.lowStockCount ? "text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400" : "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400"}
            />
            <StatCard
              title="Inventory Value"
              value={`$${(stats?.inventoryValue ?? 0).toFixed(2)}`}
              icon={ShoppingCart}
              iconBg="bg-amber-100 dark:bg-amber-900/30"
              iconColor="text-amber-600 dark:text-amber-400"
              badge="+0%"
              badgeColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Top Products</h4>
            <Link href="/inventory" className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline">
              Full Inventory
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            {productsLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : topProducts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <Package className="h-6 w-6 text-slate-400" />
                </div>
                <p className="font-medium text-slate-900 dark:text-slate-100">No products yet</p>
                <p className="text-sm text-slate-500 mt-1">Add products to your inventory to see them here</p>
                <Link href="/inventory" className="mt-4 inline-block text-primary text-sm font-semibold hover:underline">
                  Add your first product →
                </Link>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Stock Status</th>
                    <th className="px-6 py-4 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {topProducts.map((product) => {
                    const status = getStockStatus(product);
                    return (
                      <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors" data-testid={`row-product-${product.id}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              <Package className="h-4 w-4 text-slate-400" />
                            </div>
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">{product.sku ?? "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-right font-mono">${parseFloat(product.sellingPrice).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Recent Activity</h4>
          {salesLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentSales.length === 0 ? (
            <div className="py-8 text-center">
              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">No recent sales</p>
              <p className="text-xs text-slate-500 mt-1">Sales will appear here</p>
            </div>
          ) : (
            <div className="space-y-5">
              {recentSales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex gap-4" data-testid={`activity-sale-${sale.id}`}>
                  <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {sale.product?.name ?? "Product"}
                    </p>
                    <p className="text-xs text-slate-500">{sale.quantity} unit{sale.quantity !== 1 ? "s" : ""} · ${parseFloat(sale.totalPrice).toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {recentSales.length > 0 && (
            <Link href="/sales" className="w-full mt-6 py-2 text-primary text-sm font-semibold hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center">
              View All Sales
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
