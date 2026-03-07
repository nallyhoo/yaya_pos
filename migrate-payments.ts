import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const client = createClient({ url: process.env.DATABASE_URL! });
  try {
    console.log("Creating payments table...");
    
    await client.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId INTEGER REFERENCES orders(id),
        method TEXT NOT NULL,
        amount TEXT NOT NULL,
        reference TEXT,
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
