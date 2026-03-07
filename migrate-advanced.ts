import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const client = createClient({ url: process.env.DATABASE_URL! });
  try {
    console.log("Creating advanced inventory tables...");
    
    await client.execute(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contactName TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        tax_identification_number TEXT,
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        poNumber TEXT NOT NULL UNIQUE,
        supplierId INTEGER NOT NULL REFERENCES suppliers(id),
        status TEXT NOT NULL DEFAULT 'draft',
        subtotal TEXT NOT NULL,
        taxAmount TEXT DEFAULT '0.00',
        totalAmount TEXT NOT NULL,
        notes TEXT,
        receivedAt TEXT,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchaseOrderId INTEGER NOT NULL REFERENCES purchase_orders(id),
        productId INTEGER NOT NULL REFERENCES products(id),
        productName TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        costPrice TEXT NOT NULL,
        taxRate TEXT DEFAULT '0.00',
        lineTotal TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Success!");
  } catch (e: any) {
    console.error("Error:", e.message);
  } finally {
    client.close();
  }
}

main();
