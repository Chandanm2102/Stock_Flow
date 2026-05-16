import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Calendar,
  Package,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
  Award,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { 
  SalesReportItem, 
  StockSummary, 
  BestSellingProduct, 
  ProfitAnalysis, 
  SalesTrend 
} from "@shared/schema";

type ReportPeriod = "daily" | "weekly" | "monthly";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

async function fetchJson(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  return res.json();
}

export default function Reports() {
  const [period, setPeriod] = useState<ReportPeriod>("daily");
  const [trendPeriod, setTrendPeriod] = useState<ReportPeriod>("weekly");

  const { data: salesReportRaw, isLoading: salesReportLoading } = useQuery<SalesReportItem[]>({
    queryKey: ["/api/reports/sales", period],
    queryFn: () => fetchJson(`/api/reports/sales?period=${period}`),
  });
  const salesReport = Array.isArray(salesReportRaw) ? salesReportRaw : [];

  const { data: stockSummary, isLoading: stockSummaryLoading } = useQuery<StockSummary>({
    queryKey: ["/api/reports/stock-summary"],
  });

  const { data: bestSellingRaw, isLoading: bestSellingLoading } = useQuery<BestSellingProduct[]>({
    queryKey: ["/api/reports/best-selling"],
  });
  const bestSelling = Array.isArray(bestSellingRaw) ? bestSellingRaw : [];

  const { data: profitAnalysis, isLoading: profitLoading } = useQuery<ProfitAnalysis>({
    queryKey: ["/api/reports/profit-analysis"],
  });

  const { data: salesTrendsRaw, isLoading: trendsLoading } = useQuery<SalesTrend>({
    queryKey: ["/api/reports/sales-trends", trendPeriod],
    queryFn: () => fetchJson(`/api/reports/sales-trends?period=${trendPeriod}`),
  });
  const salesTrends = salesTrendsRaw && typeof salesTrendsRaw === "object" && !Array.isArray(salesTrendsRaw) ? salesTrendsRaw : undefined;

  const totalRevenue = salesReport.reduce((sum, item) => sum + item.revenue, 0);
  const totalItemsSold = salesReport.reduce((sum, item) => sum + item.itemsSold, 0);
  const totalTransactions = salesReport.reduce((sum, item) => sum + item.totalSales, 0);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

  const getPeriodLabel = (p: ReportPeriod) => {
    switch (p) {
      case "daily": return "Today vs Yesterday";
      case "weekly": return "This Week vs Last Week";
      case "monthly": return "This Month vs Last Month";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            View sales trends, profit analysis, and inventory insights
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="button-export-sales">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => window.open(`/api/export/sales/csv?period=${period}`, "_blank")}
                data-testid="button-export-sales-csv"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export Sales as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open("/api/export/sales/pdf", "_blank")}
                data-testid="button-export-sales-pdf"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export Sales as PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open("/api/export/inventory/csv", "_blank")}
                data-testid="button-export-inventory-csv"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export Inventory as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList data-testid="tabs-reports">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">Sales Trends</TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">Best Sellers</TabsTrigger>
          <TabsTrigger value="profit" data-testid="tab-profit">Profit Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
              <SelectTrigger className="w-40" data-testid="select-report-period">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card data-testid="stat-total-revenue">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-md bg-green-100 dark:bg-green-900/30">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold font-mono">
                      {salesReportLoading ? "-" : formatCurrency(totalRevenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="stat-items-sold">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-md bg-blue-100 dark:bg-blue-900/30">
                    <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Items Sold</p>
                    <p className="text-2xl font-bold font-mono">
                      {salesReportLoading ? "-" : totalItemsSold}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="stat-transactions">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-md bg-purple-100 dark:bg-purple-900/30">
                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold font-mono">
                      {salesReportLoading ? "-" : totalTransactions}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5" />
                  Sales Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesReportLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : salesReport.length === 0 ? (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <BarChart3 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="font-medium">No sales data yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Record some sales to see the chart
                    </p>
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesReport}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px",
                          }}
                        />
                        <Bar
                          dataKey="revenue"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5" />
                  Stock Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stockSummaryLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : !stockSummary ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">No stock data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-md bg-muted/50">
                      <span>Total Products</span>
                      <span className="font-mono font-bold">{stockSummary.totalItems}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-md bg-muted/50">
                      <span>Inventory Value</span>
                      <span className="font-mono font-bold">
                        {formatCurrency(stockSummary.totalValue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-md bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <span>In Stock</span>
                      </div>
                      <span className="font-mono font-bold">{stockSummary.inStock}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span>Low Stock</span>
                      </div>
                      <span className="font-mono font-bold">{stockSummary.lowStock}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-md bg-red-50 dark:bg-red-900/20">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <span>Out of Stock</span>
                      </div>
                      <span className="font-mono font-bold">{stockSummary.outOfStock}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Select value={trendPeriod} onValueChange={(v) => setTrendPeriod(v as ReportPeriod)}>
              <SelectTrigger className="w-40" data-testid="select-trend-period">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {getPeriodLabel(trendPeriod)}
            </span>
          </div>

          {trendsLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : salesTrends ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card data-testid="card-revenue-trend">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-3xl font-bold font-mono mt-1">
                        {formatCurrency(salesTrends.currentPeriodRevenue)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        vs {formatCurrency(salesTrends.previousPeriodRevenue)} previous
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${
                      salesTrends.revenueChangePercentage >= 0 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {salesTrends.revenueChangePercentage >= 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      {formatPercentage(salesTrends.revenueChangePercentage)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-sales-trend">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Sales Count</p>
                      <p className="text-3xl font-bold font-mono mt-1">
                        {salesTrends.currentPeriodSales}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        vs {salesTrends.previousPeriodSales} previous
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${
                      salesTrends.salesChangePercentage >= 0 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {salesTrends.salesChangePercentage >= 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      {formatPercentage(salesTrends.salesChangePercentage)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4 mx-auto w-fit">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium">No sales trends available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start recording sales to see trends
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5" />
                Best Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bestSellingLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : bestSelling.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4 mx-auto w-fit">
                    <Award className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium">No sales data yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Record sales to see your best sellers
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bestSelling.slice(0, 10).map((product, index) => (
                    <div
                      key={product.productId}
                      className="flex items-center gap-4 p-4 rounded-md bg-muted/30"
                      data-testid={`row-bestseller-${product.productId}`}
                    >
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.productName}</p>
                        {product.sku && (
                          <p className="text-sm text-muted-foreground font-mono">{product.sku}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-medium">{product.totalQuantitySold} sold</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {formatCurrency(product.totalRevenue)}
                        </p>
                      </div>
                      <Badge variant={product.profitMargin >= 30 ? "default" : product.profitMargin >= 15 ? "secondary" : "outline"}>
                        {product.profitMargin.toFixed(1)}% margin
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit" className="space-y-6">
          {profitLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : profitAnalysis ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card data-testid="stat-total-revenue-profit">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold font-mono mt-1">
                      {formatCurrency(profitAnalysis.totalRevenue)}
                    </p>
                  </CardContent>
                </Card>
                <Card data-testid="stat-total-cost">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-2xl font-bold font-mono mt-1">
                      {formatCurrency(profitAnalysis.totalCost)}
                    </p>
                  </CardContent>
                </Card>
                <Card data-testid="stat-gross-profit">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Gross Profit</p>
                    <p className={`text-2xl font-bold font-mono mt-1 ${
                      profitAnalysis.grossProfit >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                    }`}>
                      {formatCurrency(profitAnalysis.grossProfit)}
                    </p>
                  </CardContent>
                </Card>
                <Card data-testid="stat-margin-percentage">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Gross Margin</p>
                    <p className={`text-2xl font-bold font-mono mt-1 ${
                      profitAnalysis.grossMarginPercentage >= 20 ? "text-green-600 dark:text-green-500" : "text-yellow-600 dark:text-yellow-500"
                    }`}>
                      {profitAnalysis.grossMarginPercentage.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <PieChart className="h-5 w-5" />
                      Profit by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profitAnalysis.categoryBreakdown.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-muted-foreground">No category data available</p>
                      </div>
                    ) : (
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={profitAnalysis.categoryBreakdown}
                              dataKey="profit"
                              nameKey="categoryName"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label={({ categoryName, percent }) => 
                                `${categoryName} (${(percent * 100).toFixed(0)}%)`
                              }
                              labelLine={false}
                            >
                              {profitAnalysis.categoryBreakdown.map((_, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={CHART_COLORS[index % CHART_COLORS.length]} 
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => formatCurrency(value)}
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "6px",
                              }}
                            />
                            <Legend />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Category Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profitAnalysis.categoryBreakdown.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-muted-foreground">No category data available</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {profitAnalysis.categoryBreakdown.map((category) => (
                          <div key={category.categoryId || "uncategorized"} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{category.categoryName}</span>
                              <span className="font-mono text-sm">
                                {formatCurrency(category.profit)}
                              </span>
                            </div>
                            <Progress 
                              value={
                                profitAnalysis.grossProfit > 0 
                                  ? (category.profit / profitAnalysis.grossProfit) * 100 
                                  : 0
                              } 
                              className="h-2"
                            />
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>Revenue: {formatCurrency(category.revenue)}</span>
                              <span>Margin: {category.marginPercentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4 mx-auto w-fit">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium">No profit data available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Record sales to see your profit analysis
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
