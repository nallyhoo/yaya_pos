import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
dotenv.config();

const db_url = process.env.DATABASE_URL;
if (!db_url) { console.error("DATABASE_URL not set"); process.exit(1); }

const client = createClient({ url: db_url });

async function run(sql, params = []) {
  return client.execute({ sql, args: params });
}

console.log("🌱 Seeding YaYa Mart POS database...");

// Users
console.log("  → Users");
const hashedAdminPassword = await bcrypt.hash("admin123", 10);
await run(
  `INSERT INTO users (openId, name, email, password, role) 
   VALUES (?, ?, ?, ?, ?)
   ON CONFLICT(openId) DO UPDATE SET 
     password = excluded.password,
     role = excluded.role,
     name = excluded.name`,
  ["admin", "Admin User", "admin@example.com", hashedAdminPassword, "admin"]
);

// Categories
console.log("  → Categories");
const catData = [
  ["Beverages", "Drinks, juices, water, and sodas", "🥤"],
  ["Snacks", "Chips, crackers, and light bites", "🍿"],
  ["Dairy", "Milk, cheese, yogurt, and eggs", "🥛"],
  ["Bakery", "Bread, pastries, and baked goods", "🍞"],
  ["Produce", "Fresh fruits and vegetables", "🥦"],
  ["Frozen Foods", "Frozen meals and ice cream", "🧊"],
  ["Personal Care", "Hygiene and beauty products", "🧴"],
  ["Household", "Cleaning and home supplies", "🏠"],
];
for (const [name, description, icon] of catData) {
  await run(
    `INSERT INTO categories (name, description, icon) 
     VALUES (?, ?, ?) 
     ON CONFLICT(name) DO UPDATE SET 
       description = excluded.description,
       icon = excluded.icon`,
    [name, description, icon]
  );
}
const catsResult = await run("SELECT id, name FROM categories");
const cats = catsResult.rows;
const catMap = Object.fromEntries(cats.map(c => [c.name, c.id]));

// Products
console.log("  → Products");
const products = [
  { sku: "BEV-001", barcode: "1234567890001", name: "Coca-Cola 330ml", categoryId: catMap["Beverages"], price: "1.50", costPrice: "0.80", taxRate: "8", stockQuantity: 120, reorderPoint: 20, unit: "can" },
  { sku: "BEV-002", barcode: "1234567890002", name: "Mineral Water 500ml", categoryId: catMap["Beverages"], price: "0.99", costPrice: "0.40", taxRate: "0", stockQuantity: 200, reorderPoint: 30, unit: "bottle" },
  { sku: "BEV-003", barcode: "1234567890003", name: "Orange Juice 1L", categoryId: catMap["Beverages"], price: "3.49", costPrice: "1.80", taxRate: "0", stockQuantity: 45, reorderPoint: 15, unit: "carton" },
  { sku: "BEV-004", barcode: "1234567890004", name: "Green Tea 250ml", categoryId: catMap["Beverages"], price: "1.29", costPrice: "0.60", taxRate: "8", stockQuantity: 80, reorderPoint: 20, unit: "bottle" },
  { sku: "SNK-001", barcode: "1234567890005", name: "Lays Classic Chips", categoryId: catMap["Snacks"], price: "2.49", costPrice: "1.20", taxRate: "8", stockQuantity: 60, reorderPoint: 15, unit: "bag" },
  { sku: "SNK-002", barcode: "1234567890006", name: "Oreo Cookies 154g", categoryId: catMap["Snacks"], price: "2.99", costPrice: "1.50", taxRate: "8", stockQuantity: 40, reorderPoint: 10, unit: "pack" },
  { sku: "SNK-003", barcode: "1234567890007", name: "Peanut Butter Crackers", categoryId: catMap["Snacks"], price: "1.79", costPrice: "0.90", taxRate: "8", stockQuantity: 55, reorderPoint: 12, unit: "pack" },
  { sku: "DAI-001", barcode: "1234567890008", name: "Whole Milk 1L", categoryId: catMap["Dairy"], price: "1.89", costPrice: "1.00", taxRate: "0", stockQuantity: 30, reorderPoint: 10, unit: "carton" },
  { sku: "DAI-002", barcode: "1234567890009", name: "Greek Yogurt 200g", categoryId: catMap["Dairy"], price: "1.49", costPrice: "0.75", taxRate: "0", stockQuantity: 25, reorderPoint: 8, unit: "cup" },
  { sku: "DAI-003", barcode: "1234567890010", name: "Cheddar Cheese 200g", categoryId: catMap["Dairy"], price: "3.99", costPrice: "2.20", taxRate: "0", stockQuantity: 20, reorderPoint: 5, unit: "pack" },
  { sku: "DAI-004", barcode: "1234567890011", name: "Free Range Eggs 12pk", categoryId: catMap["Dairy"], price: "4.49", costPrice: "2.50", taxRate: "0", stockQuantity: 15, reorderPoint: 5, unit: "dozen" },
  { sku: "BAK-001", barcode: "1234567890012", name: "White Sandwich Bread", categoryId: catMap["Bakery"], price: "2.29", costPrice: "1.10", taxRate: "0", stockQuantity: 18, reorderPoint: 6, unit: "loaf" },
  { sku: "BAK-002", barcode: "1234567890013", name: "Croissant Plain", categoryId: catMap["Bakery"], price: "1.99", costPrice: "0.90", taxRate: "0", stockQuantity: 12, reorderPoint: 4, unit: "piece" },
  { sku: "PRD-001", barcode: "1234567890014", name: "Banana 1kg", categoryId: catMap["Produce"], price: "1.29", costPrice: "0.60", taxRate: "0", stockQuantity: 8, reorderPoint: 5, unit: "kg" },
  { sku: "PRD-002", barcode: "1234567890015", name: "Apple Fuji 1kg", categoryId: catMap["Produce"], price: "2.49", costPrice: "1.20", taxRate: "0", stockQuantity: 6, reorderPoint: 5, unit: "kg" },
  { sku: "FRZ-001", barcode: "1234567890016", name: "Vanilla Ice Cream 500ml", categoryId: catMap["Frozen Foods"], price: "4.99", costPrice: "2.80", taxRate: "8", stockQuantity: 22, reorderPoint: 6, unit: "tub" },
  { sku: "PCR-001", barcode: "1234567890017", name: "Shampoo 400ml", categoryId: catMap["Personal Care"], price: "5.99", costPrice: "3.00", taxRate: "8", stockQuantity: 35, reorderPoint: 8, unit: "bottle" },
  { sku: "PCR-002", barcode: "1234567890018", name: "Toothpaste 150g", categoryId: catMap["Personal Care"], price: "2.49", costPrice: "1.20", taxRate: "8", stockQuantity: 40, reorderPoint: 10, unit: "tube" },
  { sku: "HLD-001", barcode: "1234567890019", name: "Dish Soap 500ml", categoryId: catMap["Household"], price: "3.29", costPrice: "1.60", taxRate: "8", stockQuantity: 28, reorderPoint: 8, unit: "bottle" },
  { sku: "HLD-002", barcode: "1234567890020", name: "Paper Towels 2-Roll", categoryId: catMap["Household"], price: "2.99", costPrice: "1.50", taxRate: "8", stockQuantity: 3, reorderPoint: 10, unit: "pack" },
];

for (const p of products) {
  await run(
    `INSERT INTO products (sku, barcode, name, categoryId, price, costPrice, taxRate, stockQuantity, reorderPoint, unit, isActive)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
     ON CONFLICT(sku) DO UPDATE SET
       barcode = excluded.barcode,
       name = excluded.name,
       categoryId = excluded.categoryId,
       price = excluded.price,
       costPrice = excluded.costPrice,
       taxRate = excluded.taxRate,
       stockQuantity = excluded.stockQuantity,
       reorderPoint = excluded.reorderPoint,
       unit = excluded.unit`,
    [p.sku, p.barcode, p.name, p.categoryId, p.price, p.costPrice, p.taxRate, p.stockQuantity, p.reorderPoint, p.unit]
  );
}

// Customers
console.log("  → Customers");
const customers = [
  ["Alice Johnson", "alice@example.com", "012 345 678", "123 Oak St", 1250, 12, 45],
  ["Bob Smith", "bob@example.com", "011 222 333", "456 Maple Ave", 890, 8, 30],
  ["Carol White", "carol@example.com", "015 999 888", "789 Pine Rd", 2100, 20, 75],
  ["David Brown", "david@example.com", "099 777 666", "321 Elm St", 450, 4, 15],
  ["Eva Martinez", "eva@example.com", "088 555 444", "654 Cedar Blvd", 3200, 35, 120],
];
for (const [name, email, phone, address, totalSpent, visitCount, loyaltyPoints] of customers) {
  await run(
    `INSERT OR IGNORE INTO customers (name, email, phone, address, totalSpent, visitCount, loyaltyPoints)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, email, phone, address, totalSpent, visitCount, loyaltyPoints]
  );
}

// Employees
console.log("  → Employees");
const employees = [
  ["Sarah Connor", "sarah@yayamart.com", "012 888 999", "manager", "1234"],
  ["Mike Chen", "mike@yayamart.com", "011 777 666", "cashier", "5678"],
  ["Lisa Park", "lisa@yayamart.com", "015 555 444", "cashier", "9012"],
];
const defaultEmpPassword = await bcrypt.hash("pos123", 10);
for (const [name, email, phone, role, pin] of employees) {
  const openId = email.split('@')[0];
  await run(
    `INSERT INTO users (openId, name, email, password, role) 
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(openId) DO UPDATE SET 
       password = excluded.password,
       role = excluded.role`,
    [openId, name, email, defaultEmpPassword, role]
  );
  
  const userResult = await run("SELECT id FROM users WHERE openId = ?", [openId]);
  const userId = userResult.rows[0]?.id;

  await run(
    `INSERT INTO employees (userId, name, email, phone, role, pin, isActive)
     VALUES (?, ?, ?, ?, ?, ?, 1)
     ON CONFLICT(email) DO UPDATE SET
       userId = excluded.userId,
       name = excluded.name,
       phone = excluded.phone,
       role = excluded.role,
       pin = excluded.pin`,
    [userId, name, email, phone, role, pin]
  );
}

// Settings
console.log("  → Settings");
const defaultSettings = {
  storeName: "YaYa Mart",
  storeAddress: "100 Market Street, Downtown",
  storePhone: "012 345 6789",
  storeEmail: "hello@yayamart.com",
  storeCurrency: "USD",
  storeTimezone: "America/New_York",
  defaultTaxRate: "8",
  taxName: "Sales Tax",
  taxEnabled: "true",
  receiptHeader: "Welcome to YaYa Mart!",
  receiptFooter: "Thank you for shopping with us. Have a great day!",
  showLogo: "true",
  showTaxBreakdown: "true",
  receiptWidth: "80",
  lowStockThreshold: "10",
  enableLowStockAlerts: "true",
  usdToKhrRate: "4100",
};
for (const [key, value] of Object.entries(defaultSettings)) {
  await run(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
    [key, value]
  );
}

// Suppliers
console.log("  → Suppliers");
const supplierData = [
  ["Coca-Cola Cambodia", "John Smith", "012 111 222", "cola@example.com", "Veng Sreng, Phnom Penh"],
  ["Chip Mong Group", "Ly Kun", "011 333 444", "contact@chipmong.com", "Mao Tse Toung Blvd, Phnom Penh"],
];
for (const [name, contact, phone, email, addr] of supplierData) {
  await run(
    "INSERT OR IGNORE INTO suppliers (name, contactName, phone, email, address) VALUES (?, ?, ?, ?, ?)",
    [name, contact, phone, email, addr]
  );
}
// Purchase Orders
console.log("  → Purchase Orders");
await run("DELETE FROM purchase_order_items");
await run("DELETE FROM purchase_orders");

const supplierRows = (await run("SELECT id FROM suppliers")).rows;
const productRows = (await run("SELECT id, name, costPrice FROM products LIMIT 5")).rows;

if (supplierRows.length > 0 && productRows.length > 0) {
  const poData = [
    { poNumber: "PO-1001", supplierId: supplierRows[0].id, status: "received", total: "250.00" },
    { poNumber: "PO-1002", supplierId: supplierRows[1].id, status: "ordered", total: "1500.00" },
    { poNumber: "PO-1003", supplierId: supplierRows[0].id, status: "draft", total: "45.00" },
  ];

  for (const po of poData) {
    const res = await run(
      "INSERT OR IGNORE INTO purchase_orders (poNumber, supplierId, status, subtotal, totalAmount) VALUES (?, ?, ?, ?, ?)",
      [po.poNumber, po.supplierId, po.status, po.total, po.total]
    );
    
    if (res.lastInsertRowid) {
      const poId = res.lastInsertRowid;
      const p = productRows[0];
      await run(
        "INSERT INTO purchase_order_items (purchaseOrderId, productId, productName, quantity, costPrice, lineTotal) VALUES (?, ?, ?, ?, ?, ?)",
        [poId, p.id, p.name, 10, p.costPrice || "1.00", (10 * parseFloat(p.costPrice || "1.00")).toFixed(2)]
      );
    }
  }
}

// Sample orders for reports
console.log("  → Sample orders");
const prodsResult = await run("SELECT id, name, price, taxRate FROM products LIMIT 10");
const prods = prodsResult.rows;
const empsResult = await run("SELECT id FROM employees LIMIT 3");
const emps = empsResult.rows;
const custsResult = await run("SELECT id FROM customers LIMIT 5");
const custs = custsResult.rows;

const orderMethods = ["cash", "card", "wallet"];
const now = Date.now();

for (let i = 0; i < 30; i++) {
  const daysAgo = Math.floor(Math.random() * 14);
  const orderDate = new Date(now - daysAgo * 86400000 - Math.random() * 3600000 * 8);
  const numItems = Math.floor(Math.random() * 4) + 1;
  const selectedProds = prods.sort(() => Math.random() - 0.5).slice(0, numItems);

  let subtotal = 0;
  let taxAmount = 0;
  const items = selectedProds.map(p => {
    const qty = Math.floor(Math.random() * 3) + 1;
    const price = parseFloat(p.price);
    const tax = parseFloat(p.taxRate ?? "0");
    const lineTotal = qty * price;
    const lineTax = lineTotal * tax / 100;
    subtotal += lineTotal;
    taxAmount += lineTax;
    return { productId: p.id, productName: p.name, productSku: p.id, quantity: qty, unitPrice: price, taxRate: tax, taxAmount: lineTax, lineTotal };
  });

  const total = subtotal + taxAmount;
  const method = orderMethods[Math.floor(Math.random() * 3)];
  const amountPaid = method === "cash" ? Math.ceil(total / 5) * 5 : total;
  const changeGiven = amountPaid - total;
  const orderNumber = `ORD-${Date.now()}-${i}`;
  const empId = emps[Math.floor(Math.random() * emps.length)]?.id;
  const custId = Math.random() > 0.4 ? custs[Math.floor(Math.random() * custs.length)]?.id : null;

  const orderResult = await run(
    `INSERT INTO orders (orderNumber, customerId, employeeId, subtotal, taxAmount, discountAmount, totalAmount, paymentMethod, amountPaid, changeGiven, loyaltyPointsEarned, status, createdAt)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 'completed', ?)`,
    [orderNumber, custId, empId, subtotal.toFixed(2), taxAmount.toFixed(2), total.toFixed(2), method, amountPaid.toFixed(2), changeGiven.toFixed(2), Math.floor(total), orderDate.toISOString()]
  );

  const orderId = orderResult.lastInsertRowid;
  for (const item of items) {
    await run(
      `INSERT INTO order_items (orderId, productId, productName, productSku, quantity, unitPrice, taxRate, taxAmount, lineTotal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, item.productId, item.productName, item.productId, item.quantity, item.unitPrice.toFixed(2), item.taxRate.toFixed(2), item.taxAmount.toFixed(2), item.lineTotal.toFixed(2)]
    );
  }
}

console.log("✅ Seed complete!");
client.close();
