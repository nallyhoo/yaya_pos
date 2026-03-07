import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import {
  Category,
  Customer,
  Employee,
  InsertCategory,
  InsertCustomer,
  InsertEmployee,
  InsertOrder,
  InsertProduct,
  InsertSupplier,
  InsertPurchaseOrder,
  InsertPayment,
  InsertUser,
  Order,
  Product,
  Supplier,
  PurchaseOrder,
  categories,
  customers,
  employees,
  inventoryAdjustments,
  orderItems,
  orders,
  payments,
  products,
  purchaseOrders,
  purchaseOrderItems,
  settings,
  shifts,
  suppliers,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import bcrypt from "bcryptjs";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = createClient({ url: process.env.DATABASE_URL });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { ...user };
  if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
  }

  await db.insert(users).values(values).onConflictDoUpdate({
    target: users.openId,
    set: {
      name: user.name,
      email: user.email,
      loginMethod: user.loginMethod,
      lastSignedIn: user.lastSignedIn || sql`CURRENT_TIMESTAMP`,
      role: values.role
    }
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(id: number, role: "user" | "admin" | "cashier") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, id));
}

export async function updateUserPassword(id: number, passwordPlain: string) {
  const db = await getDb();
  if (!db) return;
  const passwordHash = await bcrypt.hash(passwordPlain, 10);
  await db.update(users).set({ password: passwordHash }).where(eq(users.id, id));
}

export async function verifyUserCredentials(openId: string, passwordPlain: string): Promise<User | null> {
  const user = await getUserByOpenId(openId);
  if (!user || !user.password) return null;
  const isValid = await bcrypt.compare(passwordPlain, user.password);
  return isValid ? user : null;
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result[0]?.value ?? null;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};
  const rows = await db.select().from(settings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value }
    });
}

export async function setSettings(pairs: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(pairs)) {
    await setSetting(key, value);
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────
export async function getCategories(): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.name);
}

export async function getCategoryById(id: number): Promise<Category | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0];
}

export async function createCategory(data: InsertCategory): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(categories).values(data).returning({ id: categories.id });
  return result[0].id;
}

export async function updateCategory(id: number, data: Partial<InsertCategory>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(categories).where(eq(categories.id, id));
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function getProducts(opts?: { search?: string; categoryId?: number; lowStock?: boolean }): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts?.search) {
    conditions.push(
      or(
        like(products.name, `%${opts.search}%`),
        like(products.sku, `%${opts.search}%`),
        like(products.barcode, `%${opts.search}%`)
      )
    );
  }
  if (opts?.categoryId) conditions.push(eq(products.categoryId, opts.categoryId));
  if (opts?.lowStock) conditions.push(sql`${products.stockQuantity} <= ${products.reorderPoint}`);

  const query = db.select().from(products);
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(products.name);
  }
  return query.orderBy(products.name);
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.barcode, barcode)).limit(1);
  return result[0];
}

export async function getProductBySku(sku: string): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.sku, sku)).limit(1);
  return result[0];
}

export async function createProduct(data: InsertProduct): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(products).values(data).returning({ id: products.id });
  return result[0].id;
}

export async function updateProduct(id: number, data: Partial<InsertProduct>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(products).where(eq(products.id, id));
}

export async function adjustStock(
  productId: number,
  userId: number | null,
  type: "restock" | "sale" | "adjustment" | "return" | "damage",
  quantityChange: number,
  note?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const product = await getProductById(productId);
  if (!product) throw new Error("Product not found");
  const before = product.stockQuantity;
  const after = before + quantityChange;
  await db.update(products).set({ stockQuantity: after }).where(eq(products.id, productId));
  await db.insert(inventoryAdjustments).values({
    productId,
    userId,
    type,
    quantityBefore: before,
    quantityChange,
    quantityAfter: after,
    note,
  });
}

export async function getInventoryAdjustments(productId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (productId) {
    return db
      .select()
      .from(inventoryAdjustments)
      .where(eq(inventoryAdjustments.productId, productId))
      .orderBy(desc(inventoryAdjustments.createdAt))
      .limit(100);
  }
  return db.select().from(inventoryAdjustments).orderBy(desc(inventoryAdjustments.createdAt)).limit(200);
}

export async function getLowStockProducts() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(products)
    .where(and(sql`${products.stockQuantity} <= ${products.reorderPoint}`, eq(products.isActive, true)))
    .orderBy(products.stockQuantity);
}

// ─── Customers ────────────────────────────────────────────────────────────────
export async function getCustomers(search?: string): Promise<Customer[]> {
  const db = await getDb();
  if (!db) return [];
  if (search) {
    return db
      .select()
      .from(customers)
      .where(or(like(customers.name, `%${search}%`), like(customers.phone, `%${search}%`), like(customers.email, `%${search}%`)))
      .orderBy(customers.name);
  }
  return db.select().from(customers).orderBy(customers.name);
}

export async function getCustomerById(id: number): Promise<Customer | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result[0];
}

export async function createCustomer(data: InsertCustomer): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(customers).values(data).returning({ id: customers.id });
  return result[0].id;
}

export async function updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(customers).set(data).where(eq(customers.id, id));
}

export async function deleteCustomer(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(customers).where(eq(customers.id, id));
}

// ─── Employees ────────────────────────────────────────────────────────────────
export async function getEmployees(): Promise<Employee[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employees).orderBy(employees.name);
}

export async function getEmployeeById(id: number): Promise<Employee | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result[0];
}

export async function createEmployee(data: InsertEmployee): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(employees).values(data).returning({ id: employees.id });
  return result[0].id;
}

export async function updateEmployee(id: number, data: Partial<InsertEmployee>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(employees).set(data).where(eq(employees.id, id));
}

export async function deleteEmployee(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(employees).where(eq(employees.id, id));
}

// ─── Shifts ───────────────────────────────────────────────────────────────────
export async function getShifts(employeeId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (employeeId) {
    return db.select().from(shifts).where(eq(shifts.employeeId, employeeId)).orderBy(desc(shifts.startTime)).limit(50);
  }
  return db.select().from(shifts).orderBy(desc(shifts.startTime)).limit(100);
}

export async function createShift(data: {
  employeeId: number;
  startTime: string;
  openingCash?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(shifts).values(data).returning({ id: shifts.id });
  return result[0].id;
}

export async function closeShift(id: number, data: { endTime: string; closingCash?: string; notes?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(shifts).set(data).where(eq(shifts.id, id));
}

// ─── Orders ───────────────────────────────────────────────────────────────────
function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${date}-${rand}`;
}

export async function createOrder(
  orderData: Omit<InsertOrder, "orderNumber">,
  items: Array<{
    productId: number;
    productName: string;
    productSku?: string;
    quantity: number;
    unitPrice: string;
    taxRate?: string;
    taxAmount?: string;
    discountAmount?: string;
    lineTotal: string;
  }>,
  paymentsList: Array<{
    method: "cash" | "card" | "wallet";
    amount: string;
    reference?: string;
  }>
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const orderNumber = generateOrderNumber();
  const result = await db.insert(orders).values({ ...orderData, orderNumber }).returning({ id: orders.id });
  const orderId = result[0].id;

  if (items.length > 0) {
    await db.insert(orderItems).values(items.map((item) => ({ ...item, orderId })));
  }

  if (paymentsList.length > 0) {
    await db.insert(payments).values(paymentsList.map(p => ({ ...p, orderId })));
  }

  // Deduct stock for each item
  for (const item of items) {
    await adjustStock(item.productId, null, "sale", -item.quantity, `Order #${orderNumber}`);
  }

  // Update customer stats if customerId provided
  if (orderData.customerId) {
    const customer = await getCustomerById(orderData.customerId);
    if (customer) {
      const newSpent = parseFloat(customer.totalSpent) + parseFloat(orderData.totalAmount as string);
      const newPoints = customer.loyaltyPoints + (orderData.loyaltyPointsEarned ?? 0) - (orderData.loyaltyPointsUsed ?? 0);
      await updateCustomer(orderData.customerId, {
        totalSpent: newSpent.toFixed(2),
        loyaltyPoints: Math.max(0, newPoints),
        visitCount: customer.visitCount + 1,
      });
    }
  }

  return orderId;
}

export async function getOrders(opts?: {
  from?: Date;
  to?: Date;
  status?: string;
  customerId?: number;
  limit?: number;
}): Promise<Order[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (opts?.from) conditions.push(gte(orders.createdAt, opts.from.toISOString()));
  if (opts?.to) conditions.push(lte(orders.createdAt, opts.to.toISOString()));
  if (opts?.status) conditions.push(eq(orders.status, opts.status as any));
  if (opts?.customerId) conditions.push(eq(orders.customerId, opts.customerId));

  const query = db.select().from(orders);
  const result = conditions.length > 0 ? query.where(and(...conditions)) : query;
  return result.orderBy(desc(orders.createdAt)).limit(opts?.limit ?? 200) as any;
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function updateOrderStatus(id: number, status: "pending" | "completed" | "refunded" | "cancelled") {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export async function getSalesReport(from: Date, to: Date) {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, totalOrders: 0, totalTax: 0, avgOrderValue: 0 };

  const result = await db
    .select({
      totalRevenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
      totalOrders: sql<number>`COUNT(*)`,
      totalTax: sql<number>`COALESCE(SUM(${orders.taxAmount}), 0)`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, from.toISOString()), lte(orders.createdAt, to.toISOString()), eq(orders.status, "completed")));

  const row = result[0];
  const totalRevenue = Number(row?.totalRevenue ?? 0);
  const totalOrders = Number(row?.totalOrders ?? 0);
  return {
    totalRevenue,
    totalOrders,
    totalTax: Number(row?.totalTax ?? 0),
    avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
  };
}

export async function getDailySalesData(days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const from = new Date();
  from.setDate(from.getDate() - days);

  return db
    .select({
      date: sql<string>`DATE(orders.createdAt)`,
      revenue: sql<number>`COALESCE(SUM(orders.totalAmount), 0)`,
      orderCount: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, from.toISOString()), eq(orders.status, "completed")))
    .groupBy(sql`DATE(orders.createdAt)`)
    .orderBy(sql`DATE(orders.createdAt)`);
}

export async function getTopProducts(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
      totalRevenue: sql<number>`SUM(${orderItems.lineTotal})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(eq(orders.status, "completed"))
    .groupBy(orderItems.productId, orderItems.productName)
    .orderBy(sql`SUM(${orderItems.quantity}) DESC`)
    .limit(limit);
}

export async function getPaymentMethodBreakdown(from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      paymentMethod: orders.paymentMethod,
      count: sql<number>`COUNT(*)`,
      total: sql<number>`SUM(${orders.totalAmount})`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, from.toISOString()), lte(orders.createdAt, to.toISOString()), eq(orders.status, "completed")))
    .groupBy(orders.paymentMethod);
}

export async function getEmployeeSalesStats(from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      employeeId: orders.employeeId,
      totalSales: sql<number>`SUM(${orders.totalAmount})`,
      orderCount: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, from.toISOString()), lte(orders.createdAt, to.toISOString()), eq(orders.status, "completed")))
    .groupBy(orders.employeeId);
}

// ─── Suppliers ────────────────────────────────────────────────────────────────
export async function getSuppliers(): Promise<Supplier[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(suppliers).orderBy(suppliers.name);
}

export async function createSupplier(data: InsertSupplier): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(suppliers).values(data).returning({ id: suppliers.id });
  return result[0].id;
}

export async function updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(suppliers).set(data).where(eq(suppliers.id, id));
}

export async function deleteSupplier(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(suppliers).where(eq(suppliers.id, id));
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────
export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));
}

export async function createPurchaseOrder(
  poData: InsertPurchaseOrder,
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    costPrice: string;
    taxRate?: string;
    lineTotal: string;
  }>
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const result = await db.insert(purchaseOrders).values(poData).returning({ id: purchaseOrders.id });
  const poId = result[0].id;

  if (items.length > 0) {
    await db.insert(purchaseOrderItems).values(items.map((item) => ({ ...item, purchaseOrderId: poId })));
  }

  // If status is received, update stock immediately
  if (poData.status === 'received') {
    for (const item of items) {
      await adjustStock(item.productId, null, "restock", item.quantity, `PO #${poData.poNumber}`);
      // Update product cost price
      await db.update(products).set({ costPrice: item.costPrice }).where(eq(products.id, item.productId));
    }
  }

  return poId;
}

export async function updatePurchaseOrderStatus(id: number, status: "draft" | "ordered" | "received" | "cancelled") {
  const db = await getDb();
  if (!db) return;
  
  const po = (await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).limit(1))[0];
  if (!po) throw new Error("PO not found");

  if (status === 'received' && po.status !== 'received') {
    const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));
    for (const item of items) {
      await adjustStock(item.productId, null, "restock", item.quantity, `PO #${po.poNumber}`);
      await db.update(products).set({ costPrice: item.costPrice }).where(eq(products.id, item.productId));
    }
    await db.update(purchaseOrders).set({ status, receivedAt: new Date().toISOString() }).where(eq(purchaseOrders.id, id));
  } else {
    await db.update(purchaseOrders).set({ status }).where(eq(purchaseOrders.id, id));
  }
}

