import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getProducts: vi.fn().mockResolvedValue([
    { id: 1, sku: "TEST-001", name: "Test Product", price: "10.00", taxRate: "8", stockQuantity: 50, reorderPoint: 10, unit: "pcs", isActive: true, categoryId: null, barcode: null, description: null, costPrice: "5.00", imageUrl: null, createdAt: new Date(), updatedAt: new Date() }
  ]),
  getCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "Beverages", description: "Drinks", icon: "🥤", isActive: true, createdAt: new Date() }
  ]),
  getCustomers: vi.fn().mockResolvedValue([
    { id: 1, name: "Alice Johnson", email: "alice@test.com", phone: "+1 555-0101", address: "123 Main St", loyaltyPoints: 100, totalSpent: "500.00", visitCount: 5, notes: null, createdAt: new Date(), updatedAt: new Date() }
  ]),
  getEmployees: vi.fn().mockResolvedValue([
    { id: 1, name: "Mike Chen", email: "mike@test.com", phone: null, role: "cashier", pin: "1234", isActive: true, userId: null, createdAt: new Date(), updatedAt: new Date() }
  ]),
  getOrders: vi.fn().mockResolvedValue([
    { id: 1, orderNumber: "ORD-000001", customerId: null, employeeId: 1, subtotal: "10.00", taxAmount: "0.80", discountAmount: "0.00", totalAmount: "10.80", paymentMethod: "cash", amountPaid: "15.00", changeGiven: "4.20", loyaltyPointsEarned: 10, status: "completed", notes: null, createdAt: new Date(), updatedAt: new Date() }
  ]),
  getOrderById: vi.fn().mockResolvedValue({ id: 1, orderNumber: "ORD-000001", totalAmount: "10.80", status: "completed", paymentMethod: "cash", subtotal: "10.00", taxAmount: "0.80", discountAmount: "0.00", amountPaid: "15.00", changeGiven: "4.20", customerId: null, employeeId: 1, loyaltyPointsEarned: 10, notes: null, createdAt: new Date(), updatedAt: new Date() }),
  getOrderItems: vi.fn().mockResolvedValue([]),
  createOrder: vi.fn().mockResolvedValue({ orderId: 42, orderNumber: "ORD-000042" }),
  updateOrderStatus: vi.fn().mockResolvedValue(undefined),
  getLowStockProducts: vi.fn().mockResolvedValue([]),
  getInventoryAdjustments: vi.fn().mockResolvedValue([]),
  adjustStock: vi.fn().mockResolvedValue(undefined),
  getShifts: vi.fn().mockResolvedValue([]),
  createShift: vi.fn().mockResolvedValue({ id: 1 }),
  closeShift: vi.fn().mockResolvedValue(undefined),
  getAllSettings: vi.fn().mockResolvedValue({ storeName: "YaYa Mart", defaultTaxRate: "8" }),
  setSettings: vi.fn().mockResolvedValue(undefined),
  getSalesReport: vi.fn().mockResolvedValue({ totalRevenue: 500, totalOrders: 10, avgOrderValue: 50, totalTax: 40 }),
  getDailySalesData: vi.fn().mockResolvedValue([]),
  getTopProducts: vi.fn().mockResolvedValue([]),
  getPaymentMethodBreakdown: vi.fn().mockResolvedValue([]),
  getEmployeeSalesStats: vi.fn().mockResolvedValue([]),
  createProduct: vi.fn().mockResolvedValue({ id: 99 }),
  updateProduct: vi.fn().mockResolvedValue(undefined),
  deleteProduct: vi.fn().mockResolvedValue(undefined),
  getProductById: vi.fn(),
  getProductByBarcode: vi.fn(),
  getProductBySku: vi.fn(),
  createCustomer: vi.fn().mockResolvedValue({ id: 10 }),
  updateCustomer: vi.fn().mockResolvedValue(undefined),
  deleteCustomer: vi.fn().mockResolvedValue(undefined),
  getCustomerById: vi.fn().mockResolvedValue({ id: 1, name: "Alice", email: null, phone: null, address: null, loyaltyPoints: 100, totalSpent: "500.00", visitCount: 5, notes: null, createdAt: new Date(), updatedAt: new Date() }),
  createEmployee: vi.fn().mockResolvedValue({ id: 5 }),
  updateEmployee: vi.fn().mockResolvedValue(undefined),
  deleteEmployee: vi.fn().mockResolvedValue(undefined),
  getEmployeeById: vi.fn(),
  createCategory: vi.fn().mockResolvedValue({ id: 9 }),
  updateCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  getCategoryById: vi.fn(),
  getAllUsers: vi.fn().mockResolvedValue([]),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
}));

function makeCtx(role: "admin" | "user" = "admin"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "admin@test.com",
      name: "Test Admin",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

describe("POS System - Auth", () => {
  it("returns current user from auth.me", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const user = await caller.auth.me();
    expect(user).not.toBeNull();
    expect(user?.role).toBe("admin");
  });

  it("returns null for unauthenticated user", async () => {
    const ctx: TrpcContext = { user: null, req: { protocol: "https", headers: {} } as any, res: { clearCookie: vi.fn() } as any };
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});

describe("POS System - Products", () => {
  it("lists products", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const products = await caller.products.list({});
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
    expect(products[0]).toHaveProperty("sku");
    expect(products[0]).toHaveProperty("price");
  });

  it("creates a product as admin", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.products.create({
      sku: "NEW-001", name: "New Product", price: "5.99",
      stockQuantity: 10, reorderPoint: 3, unit: "pcs",
    });
    expect(result).toHaveProperty("id");
  });

  it("returns low stock products", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const lowStock = await caller.products.lowStock();
    expect(Array.isArray(lowStock)).toBe(true);
  });
});

describe("POS System - Categories", () => {
  it("lists categories", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const cats = await caller.categories.list();
    expect(Array.isArray(cats)).toBe(true);
    expect(cats[0]).toHaveProperty("name");
  });
});

describe("POS System - Customers", () => {
  it("lists customers", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const customers = await caller.customers.list({});
    expect(Array.isArray(customers)).toBe(true);
    expect(customers[0]).toHaveProperty("loyaltyPoints");
  });

  it("creates a customer", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.customers.create({ name: "New Customer" });
    expect(result).toHaveProperty("id");
  });

  it("gets customer by id", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const customer = await caller.customers.getById({ id: 1 });
    expect(customer).not.toBeNull();
    expect(customer?.name).toBe("Alice");
  });
});

describe("POS System - Orders", () => {
  it("lists orders", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const orders = await caller.orders.list({ limit: 10 });
    expect(Array.isArray(orders)).toBe(true);
    expect(orders[0]).toHaveProperty("orderNumber");
    expect(orders[0]).toHaveProperty("totalAmount");
  });

  it("creates an order", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.orders.create({
      subtotal: "10.00",
      taxAmount: "0.80",
      discountAmount: "0.00",
      totalAmount: "10.80",
      paymentMethod: "cash",
      amountPaid: "15.00",
      changeGiven: "4.20",
      loyaltyPointsEarned: 10,
      items: [{
        productId: 1,
        productName: "Test Product",
        productSku: "TEST-001",
        quantity: 1,
        unitPrice: "10.00",
        taxRate: "8",
        taxAmount: "0.80",
        lineTotal: "10.00",
      }],
    });
    expect(result).toHaveProperty("orderId");
  });

  it("gets order by id", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const order = await caller.orders.getById({ id: 1 });
    expect(order).not.toBeNull();
    expect(order?.orderNumber).toBe("ORD-000001");
  });
});

describe("POS System - Employees", () => {
  it("lists employees", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const employees = await caller.employees.list();
    expect(Array.isArray(employees)).toBe(true);
    expect(employees[0]).toHaveProperty("role");
  });

  it("creates an employee as admin", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.employees.create({ name: "New Employee", role: "cashier" });
    expect(result).toHaveProperty("id");
  });
});

describe("POS System - Settings", () => {
  it("gets settings", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const settings = await caller.settings.get();
    expect(settings).toHaveProperty("storeName");
    expect(settings.storeName).toBe("YaYa Mart");
  });

  it("updates settings as admin", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    await expect(caller.settings.update({ storeName: "New Store Name" })).resolves.not.toThrow();
  });

  it("rejects settings update for non-admin", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.settings.update({ storeName: "Hack" })).rejects.toThrow();
  });
});

describe("POS System - Reports", () => {
  it("returns sales summary", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const summary = await caller.reports.summary({ from: new Date("2024-01-01"), to: new Date() });
    expect(summary).toHaveProperty("totalRevenue");
    expect(summary).toHaveProperty("totalOrders");
  });

  it("returns top products", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const top = await caller.reports.topProducts({ limit: 5 });
    expect(Array.isArray(top)).toBe(true);
  });
});

describe("POS System - Inventory", () => {
  it("returns inventory adjustments", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const adjustments = await caller.inventory.adjustments({});
    expect(Array.isArray(adjustments)).toBe(true);
  });

  it("returns low stock items", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const lowStock = await caller.inventory.lowStock();
    expect(Array.isArray(lowStock)).toBe(true);
  });
});
