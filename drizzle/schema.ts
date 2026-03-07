import {
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Users / Auth ────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  password: text("password"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin", "cashier"] }).default("cashier").notNull(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  lastSignedIn: text("lastSignedIn").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Store Settings ───────────────────────────────────────────────────────────
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ─── Categories ───────────────────────────────────────────────────────────────
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#6366f1"),
  icon: text("icon").default("tag"),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode"),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("categoryId").references(() => categories.id),
  price: text("price").notNull(), // text for decimal precision
  costPrice: text("costPrice").default("0.00"),
  taxRate: text("taxRate").default("0.00"),
  imageUrl: text("imageUrl"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  stockQuantity: integer("stockQuantity").default(0).notNull(),
  reorderPoint: integer("reorderPoint").default(10).notNull(),
  unit: text("unit").default("pcs"),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Inventory Adjustments ────────────────────────────────────────────────────
export const inventoryAdjustments = sqliteTable("inventory_adjustments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("productId").notNull().references(() => products.id),
  userId: integer("userId").references(() => users.id),
  type: text("type", { enum: ["restock", "sale", "adjustment", "return", "damage"] }).notNull(),
  quantityBefore: integer("quantityBefore").notNull(),
  quantityChange: integer("quantityChange").notNull(),
  quantityAfter: integer("quantityAfter").notNull(),
  note: text("note"),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type InventoryAdjustment = typeof inventoryAdjustments.$inferSelect;

// ─── Customers ────────────────────────────────────────────────────────────────
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  loyaltyPoints: integer("loyaltyPoints").default(0).notNull(),
  totalSpent: text("totalSpent").default("0.00").notNull(),
  visitCount: integer("visitCount").default(0).notNull(),
  notes: text("notes"),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ─── Employees ────────────────────────────────────────────────────────────────
export const employees = sqliteTable("employees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").references(() => users.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role", { enum: ["admin", "cashier", "manager"] }).default("cashier").notNull(),
  pin: text("pin"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  hireDate: text("hireDate").default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

// ─── Shifts ───────────────────────────────────────────────────────────────────
export const shifts = sqliteTable("shifts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employeeId").notNull().references(() => employees.id),
  startTime: text("startTime").notNull(),
  endTime: text("endTime"),
  openingCash: text("openingCash").default("0.00"),
  closingCash: text("closingCash"),
  totalSales: text("totalSales").default("0.00"),
  transactionCount: integer("transactionCount").default(0),
  notes: text("notes"),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Shift = typeof shifts.$inferSelect;

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("orderNumber").notNull().unique(),
  customerId: integer("customerId").references(() => customers.id),
  employeeId: integer("employeeId").references(() => employees.id),
  shiftId: integer("shiftId").references(() => shifts.id),
  status: text("status", { enum: ["pending", "completed", "refunded", "cancelled"] }).default("pending").notNull(),
  subtotal: text("subtotal").notNull(),
  taxAmount: text("taxAmount").default("0.00").notNull(),
  discountAmount: text("discountAmount").default("0.00").notNull(),
  totalAmount: text("totalAmount").notNull(),
  paymentMethod: text("paymentMethod", { enum: ["cash", "card", "wallet", "mixed"] }).notNull(),
  amountPaid: text("amountPaid").notNull(),
  changeGiven: text("changeGiven").default("0.00"),
  loyaltyPointsEarned: integer("loyaltyPointsEarned").default(0),
  loyaltyPointsUsed: integer("loyaltyPointsUsed").default(0),
  notes: text("notes"),
  receiptPrinted: integer("receiptPrinted", { mode: "boolean" }).default(false),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Order Items ──────────────────────────────────────────────────────────────
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("orderId").notNull().references(() => orders.id),
  productId: integer("productId").notNull().references(() => products.id),
  productName: text("productName").notNull(),
  productSku: text("productSku"),
  quantity: integer("quantity").notNull(),
  unitPrice: text("unitPrice").notNull(),
  taxRate: text("taxRate").default("0.00"),
  taxAmount: text("taxAmount").default("0.00"),
  discountAmount: text("discountAmount").default("0.00"),
  lineTotal: text("lineTotal").notNull(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const suppliers = sqliteTable("suppliers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  contactName: text("contactName"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  tin: text("tax_identification_number"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// ─── Purchase Orders ──────────────────────────────────────────────────────────
export const purchaseOrders = sqliteTable("purchase_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  poNumber: text("poNumber").notNull().unique(),
  supplierId: integer("supplierId").notNull().references(() => suppliers.id),
  status: text("status", { enum: ["draft", "ordered", "received", "cancelled"] }).default("draft").notNull(),
  subtotal: text("subtotal").notNull(),
  taxAmount: text("taxAmount").default("0.00"),
  totalAmount: text("totalAmount").notNull(),
  notes: text("notes"),
  receivedAt: text("receivedAt"),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

// ─── Purchase Order Items ─────────────────────────────────────────────────────
export const purchaseOrderItems = sqliteTable("purchase_order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  purchaseOrderId: integer("purchaseOrderId").notNull().references(() => purchaseOrders.id),
  productId: integer("productId").notNull().references(() => products.id),
  productName: text("productName").notNull(),
  quantity: integer("quantity").notNull(),
  costPrice: text("costPrice").notNull(),
  taxRate: text("taxRate").default("0.00"),
  lineTotal: text("lineTotal").notNull(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;

// ─── Payments ─────────────────────────────────────────────────────────────────
export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("orderId").references(() => orders.id),
  method: text("method", { enum: ["cash", "card", "wallet"] }).notNull(),
  amount: text("amount").notNull(),
  reference: text("reference"), // Card last 4 digits, wallet tx id, etc.
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

