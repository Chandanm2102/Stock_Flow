import {
  users,
  products,
  categories,
  sales,
  suppliers,
  purchaseOrders,
  purchaseOrderItems,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Category,
  type InsertCategory,
  type Sale,
  type InsertSale,
  type Supplier,
  type InsertSupplier,
  type PurchaseOrder,
  type InsertPurchaseOrder,
  type PurchaseOrderItem,
  type InsertPurchaseOrderItem,
  type ProductWithCategory,
  type SaleWithProduct,
  type PurchaseOrderWithSupplier,
  type PurchaseOrderFull,
  type DashboardStats,
  type SalesReportItem,
  type StockSummary,
  type BestSellingProduct,
  type ProfitAnalysis,
  type CategoryProfit,
  type SalesTrend,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lte, sql, desc, gte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: Partial<UpsertUser>): Promise<User>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined>;

  // Category operations
  getCategories(userId: string): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Product operations
  getProducts(userId: string): Promise<ProductWithCategory[]>;
  getProduct(id: number, userId: string): Promise<Product | undefined>;
  getLowStockProducts(userId: string): Promise<ProductWithCategory[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, userId: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number, userId: string): Promise<boolean>;

  // Sales operations
  getSales(userId: string): Promise<SaleWithProduct[]>;
  getRecentSales(userId: string, limit?: number): Promise<SaleWithProduct[]>;
  createSale(sale: InsertSale): Promise<Sale>;

  // Dashboard & Reports
  getDashboardStats(userId: string): Promise<DashboardStats>;
  getSalesReport(userId: string, period: "daily" | "weekly" | "monthly"): Promise<SalesReportItem[]>;
  getStockSummary(userId: string): Promise<StockSummary>;

  // Advanced Analytics
  getBestSellingProducts(userId: string, limit?: number): Promise<BestSellingProduct[]>;
  getProfitAnalysis(userId: string): Promise<ProfitAnalysis>;
  getSalesTrends(userId: string, period: "daily" | "weekly" | "monthly"): Promise<SalesTrend>;

  // Supplier operations
  getSuppliers(userId: string): Promise<Supplier[]>;
  getSupplier(id: number, userId: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, userId: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number, userId: string): Promise<boolean>;

  // Purchase Order operations
  getPurchaseOrders(userId: string): Promise<PurchaseOrderWithSupplier[]>;
  getPurchaseOrder(id: number, userId: string): Promise<PurchaseOrderFull | undefined>;
  createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(id: number, userId: string, order: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder | undefined>;
  deletePurchaseOrder(id: number, userId: string): Promise<boolean>;

  // Purchase Order Item operations
  getPurchaseOrderItems(purchaseOrderId: number): Promise<PurchaseOrderItem[]>;
  createPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem>;
  updatePurchaseOrderItem(id: number, item: Partial<InsertPurchaseOrderItem>): Promise<PurchaseOrderItem | undefined>;
  deletePurchaseOrderItem(id: number): Promise<boolean>;
  receivePurchaseOrder(id: number, userId: string, items: { itemId: number; receivedQty: number }[]): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db.insert(users).values(userData as UpsertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Category operations
  async getCategories(userId: string): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.userId, userId));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Product operations
  async getProducts(userId: string): Promise<ProductWithCategory[]> {
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        description: products.description,
        categoryId: products.categoryId,
        quantity: products.quantity,
        costPrice: products.costPrice,
        sellingPrice: products.sellingPrice,
        lowStockThreshold: products.lowStockThreshold,
        userId: products.userId,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        category: categories,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.userId, userId))
      .orderBy(desc(products.createdAt));

    return result.map((row) => ({
      ...row,
      category: row.category,
    }));
  }

  async getProduct(id: number, userId: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.userId, userId)));
    return product;
  }

  async getLowStockProducts(userId: string): Promise<ProductWithCategory[]> {
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        description: products.description,
        categoryId: products.categoryId,
        quantity: products.quantity,
        costPrice: products.costPrice,
        sellingPrice: products.sellingPrice,
        lowStockThreshold: products.lowStockThreshold,
        userId: products.userId,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        category: categories,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          eq(products.userId, userId),
          lte(products.quantity, products.lowStockThreshold)
        )
      )
      .orderBy(products.quantity);

    return result.map((row) => ({
      ...row,
      category: row.category,
    }));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(
    id: number,
    userId: string,
    product: Partial<InsertProduct>
  ): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.userId, userId)))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Sales operations
  async getSales(userId: string): Promise<SaleWithProduct[]> {
    const result = await db
      .select({
        id: sales.id,
        productId: sales.productId,
        quantity: sales.quantity,
        unitPrice: sales.unitPrice,
        totalPrice: sales.totalPrice,
        userId: sales.userId,
        saleDate: sales.saleDate,
        createdAt: sales.createdAt,
        product: products,
      })
      .from(sales)
      .leftJoin(products, eq(sales.productId, products.id))
      .where(eq(sales.userId, userId))
      .orderBy(desc(sales.saleDate));

    return result.map((row) => ({
      ...row,
      product: row.product,
    }));
  }

  async getRecentSales(userId: string, limit = 10): Promise<SaleWithProduct[]> {
    const result = await db
      .select({
        id: sales.id,
        productId: sales.productId,
        quantity: sales.quantity,
        unitPrice: sales.unitPrice,
        totalPrice: sales.totalPrice,
        userId: sales.userId,
        saleDate: sales.saleDate,
        createdAt: sales.createdAt,
        product: products,
      })
      .from(sales)
      .leftJoin(products, eq(sales.productId, products.id))
      .where(eq(sales.userId, userId))
      .orderBy(desc(sales.saleDate))
      .limit(limit);

    return result.map((row) => ({
      ...row,
      product: row.product,
    }));
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const totalPrice = (parseFloat(sale.unitPrice) * sale.quantity).toString();
    const [newSale] = await db
      .insert(sales)
      .values({
        ...sale,
        totalPrice,
      })
      .returning();

    // Update product quantity
    await db
      .update(products)
      .set({
        quantity: sql`${products.quantity} - ${sale.quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, sale.productId));

    return newSale;
  }

  // Dashboard & Reports
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    // Total products
    const [productCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.userId, userId));

    // Low stock count
    const [lowStockCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(
        and(
          eq(products.userId, userId),
          lte(products.quantity, products.lowStockThreshold)
        )
      );

    // Today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todaySalesResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${sales.totalPrice}::numeric), 0)::float` })
      .from(sales)
      .where(and(eq(sales.userId, userId), gte(sales.saleDate, today)));

    // Inventory value
    const [inventoryValue] = await db
      .select({
        value: sql<number>`COALESCE(SUM(${products.quantity} * ${products.sellingPrice}::numeric), 0)::float`,
      })
      .from(products)
      .where(eq(products.userId, userId));

    return {
      totalProducts: productCount?.count || 0,
      lowStockCount: lowStockCount?.count || 0,
      todaySales: todaySalesResult?.total || 0,
      inventoryValue: inventoryValue?.value || 0,
    };
  }

  async getSalesReport(
    userId: string,
    period: "daily" | "weekly" | "monthly"
  ): Promise<SalesReportItem[]> {
    let dateFormat: string;
    let daysBack: number;

    switch (period) {
      case "daily":
        dateFormat = "YYYY-MM-DD";
        daysBack = 7;
        break;
      case "weekly":
        dateFormat = "IYYY-IW";
        daysBack = 28;
        break;
      case "monthly":
        dateFormat = "YYYY-MM";
        daysBack = 90;
        break;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const result = await db.execute(sql`
      SELECT
        to_char(sale_date, ${dateFormat}) AS date,
        COUNT(*)::int AS "totalSales",
        COALESCE(SUM(quantity), 0)::int AS "itemsSold",
        COALESCE(SUM(total_price::numeric), 0)::float AS revenue
      FROM sales
      WHERE user_id = ${userId}
        AND sale_date >= ${startDate}
      GROUP BY 1
      ORDER BY 1
    `);

    return result.rows as SalesReportItem[];
  }

  async getStockSummary(userId: string): Promise<StockSummary> {
    const [result] = await db
      .select({
        totalItems: sql<number>`count(*)::int`,
        totalValue: sql<number>`COALESCE(SUM(${products.quantity} * ${products.sellingPrice}::numeric), 0)::float`,
        inStock: sql<number>`count(*) FILTER (WHERE ${products.quantity} > ${products.lowStockThreshold})::int`,
        lowStock: sql<number>`count(*) FILTER (WHERE ${products.quantity} > 0 AND ${products.quantity} <= ${products.lowStockThreshold})::int`,
        outOfStock: sql<number>`count(*) FILTER (WHERE ${products.quantity} = 0)::int`,
      })
      .from(products)
      .where(eq(products.userId, userId));

    return {
      totalItems: result?.totalItems || 0,
      totalValue: result?.totalValue || 0,
      inStock: result?.inStock || 0,
      lowStock: result?.lowStock || 0,
      outOfStock: result?.outOfStock || 0,
    };
  }

  // Advanced Analytics
  async getBestSellingProducts(userId: string, limit: number = 10): Promise<BestSellingProduct[]> {
    const result = await db
      .select({
        productId: products.id,
        productName: products.name,
        sku: products.sku,
        totalQuantitySold: sql<number>`COALESCE(SUM(${sales.quantity}), 0)::int`,
        totalRevenue: sql<number>`COALESCE(SUM(${sales.totalPrice}::numeric), 0)::float`,
        costPrice: products.costPrice,
        sellingPrice: products.sellingPrice,
      })
      .from(products)
      .leftJoin(sales, eq(sales.productId, products.id))
      .where(eq(products.userId, userId))
      .groupBy(products.id, products.name, products.sku, products.costPrice, products.sellingPrice)
      .orderBy(sql`COALESCE(SUM(${sales.quantity}), 0) DESC`)
      .limit(limit);

    return result.map((row) => {
      const cost = parseFloat(row.costPrice || "0");
      const selling = parseFloat(row.sellingPrice);
      const margin = selling > 0 ? ((selling - cost) / selling) * 100 : 0;
      return {
        productId: row.productId,
        productName: row.productName,
        sku: row.sku,
        totalQuantitySold: row.totalQuantitySold,
        totalRevenue: row.totalRevenue,
        profitMargin: Math.round(margin * 100) / 100,
      };
    });
  }

  async getProfitAnalysis(userId: string): Promise<ProfitAnalysis> {
    const salesData = await db
      .select({
        categoryId: products.categoryId,
        categoryName: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
        revenue: sql<number>`COALESCE(SUM(${sales.totalPrice}::numeric), 0)::float`,
        quantity: sql<number>`COALESCE(SUM(${sales.quantity}), 0)::int`,
        costPerUnit: products.costPrice,
      })
      .from(sales)
      .innerJoin(products, eq(sales.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(sales.userId, userId))
      .groupBy(products.categoryId, categories.name, products.costPrice);

    const categoryMap = new Map<string, CategoryProfit>();

    for (const row of salesData) {
      const key = row.categoryId?.toString() || "null";
      const existing = categoryMap.get(key);
      const cost = parseFloat(row.costPerUnit || "0") * row.quantity;

      if (existing) {
        existing.revenue += row.revenue;
        existing.cost += cost;
        existing.profit = existing.revenue - existing.cost;
        existing.marginPercentage = existing.revenue > 0 
          ? Math.round(((existing.revenue - existing.cost) / existing.revenue) * 10000) / 100 
          : 0;
      } else {
        categoryMap.set(key, {
          categoryId: row.categoryId,
          categoryName: row.categoryName,
          revenue: row.revenue,
          cost: cost,
          profit: row.revenue - cost,
          marginPercentage: row.revenue > 0 
            ? Math.round(((row.revenue - cost) / row.revenue) * 10000) / 100 
            : 0,
        });
      }
    }

    const categoryBreakdown = Array.from(categoryMap.values()).sort((a, b) => b.profit - a.profit);
    const totalRevenue = categoryBreakdown.reduce((sum, c) => sum + c.revenue, 0);
    const totalCost = categoryBreakdown.reduce((sum, c) => sum + c.cost, 0);
    const grossProfit = totalRevenue - totalCost;

    return {
      totalRevenue,
      totalCost,
      grossProfit,
      grossMarginPercentage: totalRevenue > 0 
        ? Math.round((grossProfit / totalRevenue) * 10000) / 100 
        : 0,
      categoryBreakdown,
    };
  }

  async getSalesTrends(
    userId: string,
    period: "daily" | "weekly" | "monthly"
  ): Promise<SalesTrend> {
    let daysBack: number;
    switch (period) {
      case "daily":
        daysBack = 1;
        break;
      case "weekly":
        daysBack = 7;
        break;
      case "monthly":
        daysBack = 30;
        break;
    }

    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - daysBack);
    
    const previousStart = new Date();
    previousStart.setDate(previousStart.getDate() - daysBack * 2);

    const [currentResult] = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(${sales.totalPrice}::numeric), 0)::float`,
        salesCount: sql<number>`count(*)::int`,
      })
      .from(sales)
      .where(and(eq(sales.userId, userId), gte(sales.saleDate, currentStart)));

    const [previousResult] = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(${sales.totalPrice}::numeric), 0)::float`,
        salesCount: sql<number>`count(*)::int`,
      })
      .from(sales)
      .where(
        and(
          eq(sales.userId, userId),
          gte(sales.saleDate, previousStart),
          sql`${sales.saleDate} < ${currentStart}`
        )
      );

    const currentRevenue = currentResult?.revenue || 0;
    const previousRevenue = previousResult?.revenue || 0;
    const currentSales = currentResult?.salesCount || 0;
    const previousSales = previousResult?.salesCount || 0;

    return {
      currentPeriodRevenue: currentRevenue,
      previousPeriodRevenue: previousRevenue,
      revenueChange: currentRevenue - previousRevenue,
      revenueChangePercentage: previousRevenue > 0 
        ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 10000) / 100 
        : currentRevenue > 0 ? 100 : 0,
      currentPeriodSales: currentSales,
      previousPeriodSales: previousSales,
      salesChange: currentSales - previousSales,
      salesChangePercentage: previousSales > 0 
        ? Math.round(((currentSales - previousSales) / previousSales) * 10000) / 100 
        : currentSales > 0 ? 100 : 0,
    };
  }

  // Supplier operations
  async getSuppliers(userId: string): Promise<Supplier[]> {
    return db
      .select()
      .from(suppliers)
      .where(eq(suppliers.userId, userId))
      .orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(id: number, userId: string): Promise<Supplier | undefined> {
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.userId, userId)));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(
    id: number,
    userId: string,
    supplier: Partial<InsertSupplier>
  ): Promise<Supplier | undefined> {
    const [updated] = await db
      .update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(and(eq(suppliers.id, id), eq(suppliers.userId, userId)))
      .returning();
    return updated;
  }

  async deleteSupplier(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Purchase Order operations
  async getPurchaseOrders(userId: string): Promise<PurchaseOrderWithSupplier[]> {
    const result = await db
      .select({
        id: purchaseOrders.id,
        supplierId: purchaseOrders.supplierId,
        orderNumber: purchaseOrders.orderNumber,
        status: purchaseOrders.status,
        totalAmount: purchaseOrders.totalAmount,
        notes: purchaseOrders.notes,
        orderDate: purchaseOrders.orderDate,
        expectedDelivery: purchaseOrders.expectedDelivery,
        receivedDate: purchaseOrders.receivedDate,
        userId: purchaseOrders.userId,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
        supplier: suppliers,
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .where(eq(purchaseOrders.userId, userId))
      .orderBy(desc(purchaseOrders.createdAt));

    return result.map((row) => ({
      ...row,
      supplier: row.supplier,
    }));
  }

  async getPurchaseOrder(id: number, userId: string): Promise<PurchaseOrderFull | undefined> {
    const [order] = await db
      .select({
        id: purchaseOrders.id,
        supplierId: purchaseOrders.supplierId,
        orderNumber: purchaseOrders.orderNumber,
        status: purchaseOrders.status,
        totalAmount: purchaseOrders.totalAmount,
        notes: purchaseOrders.notes,
        orderDate: purchaseOrders.orderDate,
        expectedDelivery: purchaseOrders.expectedDelivery,
        receivedDate: purchaseOrders.receivedDate,
        userId: purchaseOrders.userId,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
        supplier: suppliers,
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));

    if (!order) return undefined;

    const items = await db
      .select({
        id: purchaseOrderItems.id,
        purchaseOrderId: purchaseOrderItems.purchaseOrderId,
        productId: purchaseOrderItems.productId,
        quantity: purchaseOrderItems.quantity,
        unitCost: purchaseOrderItems.unitCost,
        totalCost: purchaseOrderItems.totalCost,
        receivedQuantity: purchaseOrderItems.receivedQuantity,
        createdAt: purchaseOrderItems.createdAt,
        product: products,
      })
      .from(purchaseOrderItems)
      .leftJoin(products, eq(purchaseOrderItems.productId, products.id))
      .where(eq(purchaseOrderItems.purchaseOrderId, id));

    return {
      ...order,
      supplier: order.supplier,
      items: items.map((item) => ({
        ...item,
        product: item.product,
      })),
    };
  }

  async createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const [newOrder] = await db.insert(purchaseOrders).values(order).returning();
    return newOrder;
  }

  async updatePurchaseOrder(
    id: number,
    userId: string,
    order: Partial<InsertPurchaseOrder>
  ): Promise<PurchaseOrder | undefined> {
    const [updated] = await db
      .update(purchaseOrders)
      .set({ ...order, updatedAt: new Date() })
      .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)))
      .returning();
    return updated;
  }

  async deletePurchaseOrder(id: number, userId: string): Promise<boolean> {
    // First delete all items
    await db
      .delete(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, id));
    
    // Then delete the order
    const result = await db
      .delete(purchaseOrders)
      .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Purchase Order Item operations
  async getPurchaseOrderItems(purchaseOrderId: number): Promise<PurchaseOrderItem[]> {
    return db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
  }

  async createPurchaseOrderItem(item: InsertPurchaseOrderItem): Promise<PurchaseOrderItem> {
    const [newItem] = await db.insert(purchaseOrderItems).values(item).returning();
    
    // Update purchase order total
    await this.updatePurchaseOrderTotal(item.purchaseOrderId);
    
    return newItem;
  }

  async updatePurchaseOrderItem(
    id: number,
    item: Partial<InsertPurchaseOrderItem>
  ): Promise<PurchaseOrderItem | undefined> {
    const [updated] = await db
      .update(purchaseOrderItems)
      .set(item)
      .where(eq(purchaseOrderItems.id, id))
      .returning();
    
    if (updated) {
      await this.updatePurchaseOrderTotal(updated.purchaseOrderId);
    }
    
    return updated;
  }

  async deletePurchaseOrderItem(id: number): Promise<boolean> {
    const [item] = await db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.id, id));
    
    if (!item) return false;
    
    const result = await db
      .delete(purchaseOrderItems)
      .where(eq(purchaseOrderItems.id, id))
      .returning();
    
    if (result.length > 0) {
      await this.updatePurchaseOrderTotal(item.purchaseOrderId);
    }
    
    return result.length > 0;
  }

  async receivePurchaseOrder(
    id: number,
    userId: string,
    items: { itemId: number; receivedQty: number }[]
  ): Promise<boolean> {
    // Update each item's received quantity and product stock
    for (const { itemId, receivedQty } of items) {
      const [item] = await db
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.id, itemId));
      
      if (item) {
        const previouslyReceived = item.receivedQuantity;
        const newlyReceived = receivedQty - previouslyReceived;
        
        // Update item received quantity
        await db
          .update(purchaseOrderItems)
          .set({ receivedQuantity: receivedQty })
          .where(eq(purchaseOrderItems.id, itemId));
        
        // Update product stock
        if (newlyReceived > 0) {
          await db
            .update(products)
            .set({
              quantity: sql`${products.quantity} + ${newlyReceived}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));
        }
      }
    }
    
    // Update order status
    const [order] = await db
      .select()
      .from(purchaseOrders)
      .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
    
    if (!order) return false;
    
    const allItems = await db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, id));
    
    const fullyReceived = allItems.every((item) => item.receivedQuantity >= item.quantity);
    const partiallyReceived = allItems.some((item) => item.receivedQuantity > 0);
    
    let newStatus = order.status;
    if (fullyReceived) {
      newStatus = "received";
    } else if (partiallyReceived) {
      newStatus = "partial";
    }
    
    await db
      .update(purchaseOrders)
      .set({
        status: newStatus,
        receivedDate: fullyReceived ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(purchaseOrders.id, id));
    
    return true;
  }

  private async updatePurchaseOrderTotal(purchaseOrderId: number): Promise<void> {
    const [result] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${purchaseOrderItems.totalCost}::numeric), 0)::float`,
      })
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
    
    await db
      .update(purchaseOrders)
      .set({ totalAmount: result.total.toString(), updatedAt: new Date() })
      .where(eq(purchaseOrders.id, purchaseOrderId));
  }
}

export const storage = new DatabaseStorage();
