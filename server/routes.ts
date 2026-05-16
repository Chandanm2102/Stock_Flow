import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { 
  insertProductSchema, 
  insertCategorySchema, 
  insertSaleSchema,
  insertSupplierSchema,
  insertPurchaseOrderSchema,
  insertPurchaseOrderItemSchema,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "@shared/schema";
import { z } from "zod";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import passport from "passport";
import { isAuthenticated, hashPassword, comparePassword } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ─── Auth Routes ───────────────────────────────────────────────────────────

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);

      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      const passwordHash = await hashPassword(data.password);
      const user = await storage.createUser({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        storeName: data.storeName || null,
        passwordHash,
      });

      req.login(user, (err) => {
        if (err) {
          console.error("Login after register failed:", err);
          return res.status(500).json({ message: "Registration succeeded but login failed" });
        }
        const { passwordHash: _, ...safeUser } = user;
        res.status(201).json(safeUser);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid email or password" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Login failed" });
        }
        const { passwordHash: _, ...safeUser } = user;
        res.json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = req.user as any;
    const { passwordHash: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.patch("/api/auth/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const data = updateProfileSchema.parse(req.body);

      if (data.email) {
        const existing = await storage.getUserByEmail(data.email);
        if (existing && existing.id !== userId) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }

      const user = await storage.updateUser(userId, data);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { passwordHash: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post("/api/auth/change-password", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const data = changePasswordSchema.parse(req.body);

      const user = await storage.getUser(userId);
      if (!user || !user.passwordHash) {
        return res.status(400).json({ message: "No password set for this account" });
      }

      const valid = await comparePassword(data.currentPassword, user.passwordHash);
      if (!valid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const newHash = await hashPassword(data.newPassword);
      await storage.updateUser(userId, { passwordHash: newHash });
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // ─── Categories ────────────────────────────────────────────────────────────

  app.get("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const categories = await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertCategorySchema.parse({ ...req.body, userId });
      const category = await storage.createCategory(data);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // ─── Products ──────────────────────────────────────────────────────────────

  app.get("/api/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const products = await storage.getProducts(userId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/low-stock", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const products = await storage.getLowStockProducts(userId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      res.status(500).json({ message: "Failed to fetch low stock products" });
    }
  });

  app.post("/api/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertProductSchema.parse({ ...req.body, userId });
      const product = await storage.createProduct(data);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      const product = await storage.updateProduct(productId, userId, req.body);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      const deleted = await storage.deleteProduct(productId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // ─── Sales ─────────────────────────────────────────────────────────────────

  app.get("/api/sales", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const salesData = await storage.getSales(userId);
      res.json(salesData);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.get("/api/sales/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const salesData = await storage.getRecentSales(userId, limit);
      res.json(salesData);
    } catch (error) {
      console.error("Error fetching recent sales:", error);
      res.status(500).json({ message: "Failed to fetch recent sales" });
    }
  });

  app.post("/api/sales", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { productId, quantity, unitPrice } = req.body;

      const product = await storage.getProduct(productId, userId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      if (product.quantity < quantity) {
        return res.status(400).json({ message: `Insufficient stock. Available: ${product.quantity}` });
      }

      const data = insertSaleSchema.parse({ productId, quantity, unitPrice, userId });
      const sale = await storage.createSale(data);
      res.status(201).json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating sale:", error);
      res.status(500).json({ message: "Failed to record sale" });
    }
  });

  // ─── Reports ───────────────────────────────────────────────────────────────

  app.get("/api/reports/sales", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const period = (req.query.period as string) || "daily";
      if (!["daily", "weekly", "monthly"].includes(period)) {
        return res.status(400).json({ message: "Invalid period" });
      }
      const report = await storage.getSalesReport(userId, period as "daily" | "weekly" | "monthly");
      res.json(report);
    } catch (error) {
      console.error("Error fetching sales report:", error);
      res.status(500).json({ message: "Failed to fetch sales report" });
    }
  });

  app.get("/api/reports/stock-summary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const summary = await storage.getStockSummary(userId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching stock summary:", error);
      res.status(500).json({ message: "Failed to fetch stock summary" });
    }
  });

  app.get("/api/reports/best-selling", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const products = await storage.getBestSellingProducts(userId, limit);
      res.json(products);
    } catch (error) {
      console.error("Error fetching best selling products:", error);
      res.status(500).json({ message: "Failed to fetch best selling products" });
    }
  });

  app.get("/api/reports/profit-analysis", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const analysis = await storage.getProfitAnalysis(userId);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching profit analysis:", error);
      res.status(500).json({ message: "Failed to fetch profit analysis" });
    }
  });

  app.get("/api/reports/sales-trends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const period = (req.query.period as string) || "weekly";
      if (!["daily", "weekly", "monthly"].includes(period)) {
        return res.status(400).json({ message: "Invalid period" });
      }
      const trends = await storage.getSalesTrends(userId, period as "daily" | "weekly" | "monthly");
      res.json(trends);
    } catch (error) {
      console.error("Error fetching sales trends:", error);
      res.status(500).json({ message: "Failed to fetch sales trends" });
    }
  });

  // ─── Exports ───────────────────────────────────────────────────────────────

  app.get("/api/export/inventory/csv", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const products = await storage.getProducts(userId);
      const flattenedProducts = products.map((p: any) => ({
        name: p.name || "",
        sku: p.sku || "",
        category: p.category?.name || "Uncategorized",
        quantity: p.quantity || 0,
        costPrice: Number(p.costPrice || 0).toFixed(2),
        sellingPrice: Number(p.sellingPrice || 0).toFixed(2),
        lowStockThreshold: p.lowStockThreshold || 0,
        createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "",
      }));
      const fields = ["name", "sku", "category", "quantity", "costPrice", "sellingPrice", "lowStockThreshold", "createdAt"];
      const parser = new Parser({ fields });
      const csv = parser.parse(flattenedProducts);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=inventory.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error exporting inventory CSV:", error);
      res.status(500).json({ message: "Failed to export inventory" });
    }
  });

  app.get("/api/export/inventory/pdf", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const products = await storage.getProducts(userId);
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=inventory.pdf");
      doc.pipe(res);
      doc.fontSize(20).text("Inventory Report", { align: "center" });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: "center" });
      doc.moveDown(2);
      const tableTop = doc.y;
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Product", 50, tableTop);
      doc.text("SKU", 180, tableTop);
      doc.text("Qty", 280, tableTop);
      doc.text("Cost", 340, tableTop);
      doc.text("Price", 400, tableTop);
      doc.text("Value", 460, tableTop);
      doc.moveDown();
      doc.font("Helvetica");
      let y = doc.y;
      products.forEach((p: any) => {
        if (y > 700) { doc.addPage(); y = 50; }
        const qty = Number(p.quantity || 0);
        const price = Number(p.sellingPrice || 0);
        const cost = Number(p.costPrice || 0);
        const value = (qty * price).toFixed(2);
        doc.text((p.name || "Unknown").substring(0, 20), 50, y);
        doc.text(p.sku || "-", 180, y);
        doc.text(String(qty), 280, y);
        doc.text(`$${cost.toFixed(2)}`, 340, y);
        doc.text(`$${price.toFixed(2)}`, 400, y);
        doc.text(`$${value}`, 460, y);
        y += 20;
      });
      doc.end();
    } catch (error) {
      console.error("Error exporting inventory PDF:", error);
      res.status(500).json({ message: "Failed to export inventory" });
    }
  });

  app.get("/api/export/sales/csv", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const salesData = await storage.getSales(userId);
      const flattenedSales = salesData.map((s: any) => ({
        date: s.saleDate ? new Date(s.saleDate).toLocaleDateString() : "",
        productName: s.product?.name || "Unknown Product",
        quantity: s.quantity || 0,
        unitPrice: Number(s.unitPrice || 0).toFixed(2),
        totalAmount: Number(s.totalPrice || 0).toFixed(2),
      }));
      const fields = ["date", "productName", "quantity", "unitPrice", "totalAmount"];
      const parser = new Parser({ fields });
      const csv = parser.parse(flattenedSales);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=sales.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error exporting sales CSV:", error);
      res.status(500).json({ message: "Failed to export sales" });
    }
  });

  app.get("/api/export/sales/pdf", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const salesData = await storage.getSales(userId);
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=sales-report.pdf");
      doc.pipe(res);
      doc.fontSize(20).text("Sales Report", { align: "center" });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: "center" });
      doc.moveDown(2);
      const totalRevenue = salesData.reduce((sum: number, s: any) => sum + Number(s.totalPrice || 0), 0);
      const totalItems = salesData.reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0);
      doc.fontSize(12).font("Helvetica-Bold").text("Summary");
      doc.font("Helvetica").fontSize(10);
      doc.text(`Total Transactions: ${salesData.length}`);
      doc.text(`Total Items Sold: ${totalItems}`);
      doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`);
      doc.moveDown(2);
      doc.fontSize(12).font("Helvetica-Bold").text("Transaction Details");
      doc.moveDown();
      const tableTop = doc.y;
      doc.fontSize(9).font("Helvetica-Bold");
      doc.text("Date", 50, tableTop);
      doc.text("Product", 130, tableTop);
      doc.text("Qty", 300, tableTop);
      doc.text("Price", 350, tableTop);
      doc.text("Total", 420, tableTop);
      doc.moveDown();
      doc.font("Helvetica");
      let y = doc.y;
      salesData.slice(0, 50).forEach((s: any) => {
        if (y > 700) { doc.addPage(); y = 50; }
        const date = s.saleDate ? new Date(s.saleDate).toLocaleDateString() : "";
        const productName = s.product?.name || "Unknown Product";
        const qty = Number(s.quantity || 0);
        const price = Number(s.unitPrice || 0);
        const total = Number(s.totalPrice || 0);
        doc.text(date, 50, y);
        doc.text(productName.substring(0, 25), 130, y);
        doc.text(String(qty), 300, y);
        doc.text(`$${price.toFixed(2)}`, 350, y);
        doc.text(`$${total.toFixed(2)}`, 420, y);
        y += 18;
      });
      doc.end();
    } catch (error) {
      console.error("Error exporting sales PDF:", error);
      res.status(500).json({ message: "Failed to export sales" });
    }
  });

  app.get("/api/export/low-stock/csv", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const products = await storage.getLowStockProducts(userId);
      const flattenedProducts = products.map((p: any) => ({
        name: p.name || "",
        sku: p.sku || "",
        category: p.category?.name || "Uncategorized",
        currentStock: p.quantity || 0,
        threshold: p.lowStockThreshold || 0,
        shortage: Math.max(0, (p.lowStockThreshold || 0) - (p.quantity || 0)),
        sellingPrice: Number(p.sellingPrice || 0).toFixed(2),
      }));
      const fields = ["name", "sku", "category", "currentStock", "threshold", "shortage", "sellingPrice"];
      const parser = new Parser({ fields });
      const csv = parser.parse(flattenedProducts);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=low-stock.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error exporting low stock CSV:", error);
      res.status(500).json({ message: "Failed to export low stock list" });
    }
  });

  // ─── Suppliers ─────────────────────────────────────────────────────────────

  app.get("/api/suppliers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const suppliers = await storage.getSuppliers(userId);
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.get("/api/suppliers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const supplierId = parseInt(req.params.id);
      if (isNaN(supplierId)) {
        return res.status(400).json({ message: "Invalid supplier ID" });
      }
      const supplier = await storage.getSupplier(supplierId, userId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  app.post("/api/suppliers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertSupplierSchema.parse({ ...req.body, userId });
      const supplier = await storage.createSupplier(data);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.patch("/api/suppliers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const supplierId = parseInt(req.params.id);
      if (isNaN(supplierId)) {
        return res.status(400).json({ message: "Invalid supplier ID" });
      }
      const supplier = await storage.updateSupplier(supplierId, userId, req.body);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const supplierId = parseInt(req.params.id);
      if (isNaN(supplierId)) {
        return res.status(400).json({ message: "Invalid supplier ID" });
      }
      const deleted = await storage.deleteSupplier(supplierId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // ─── Purchase Orders ────────────────────────────────────────────────────────

  app.get("/api/purchase-orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const orders = await storage.getPurchaseOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  app.get("/api/purchase-orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      const order = await storage.getPurchaseOrder(orderId, userId);
      if (!order) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching purchase order:", error);
      res.status(500).json({ message: "Failed to fetch purchase order" });
    }
  });

  app.post("/api/purchase-orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertPurchaseOrderSchema.parse({ ...req.body, userId });
      const order = await storage.createPurchaseOrder(data);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating purchase order:", error);
      res.status(500).json({ message: "Failed to create purchase order" });
    }
  });

  app.patch("/api/purchase-orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      const order = await storage.updatePurchaseOrder(orderId, userId, req.body);
      if (!order) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating purchase order:", error);
      res.status(500).json({ message: "Failed to update purchase order" });
    }
  });

  app.delete("/api/purchase-orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      const deleted = await storage.deletePurchaseOrder(orderId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting purchase order:", error);
      res.status(500).json({ message: "Failed to delete purchase order" });
    }
  });

  // ─── Purchase Order Items ──────────────────────────────────────────────────

  app.post("/api/purchase-orders/:id/items", isAuthenticated, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      const data = insertPurchaseOrderItemSchema.parse({ ...req.body, purchaseOrderId: orderId });
      const item = await storage.createPurchaseOrderItem(data);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating purchase order item:", error);
      res.status(500).json({ message: "Failed to create purchase order item" });
    }
  });

  app.patch("/api/purchase-order-items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const itemId = parseInt(req.params.id);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      const item = await storage.updatePurchaseOrderItem(itemId, req.body);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating purchase order item:", error);
      res.status(500).json({ message: "Failed to update purchase order item" });
    }
  });

  app.delete("/api/purchase-order-items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const itemId = parseInt(req.params.id);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      const deleted = await storage.deletePurchaseOrderItem(itemId);
      if (!deleted) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting purchase order item:", error);
      res.status(500).json({ message: "Failed to delete purchase order item" });
    }
  });

  app.post("/api/purchase-orders/:id/receive", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Items must be an array" });
      }
      const success = await storage.receivePurchaseOrder(orderId, userId, items);
      if (!success) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      res.json({ message: "Purchase order received successfully" });
    } catch (error) {
      console.error("Error receiving purchase order:", error);
      res.status(500).json({ message: "Failed to receive purchase order" });
    }
  });

  return httpServer;
}
