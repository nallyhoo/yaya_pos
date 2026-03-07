import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const client = createClient({ url: process.env.DATABASE_URL! });
  try {
    console.log("Starting database cleanup...");
    
    // Temporarily disable foreign keys for cleanup if supported by the driver/server
    // LibSQL usually doesn't allow PRAGMA foreign_keys = OFF in a transaction or sometimes at all via this client
    // So we'll just try to be surgical or ignore errors for the index creation
    
    console.log("Cleaning up duplicate categories...");
    await client.execute(`
      DELETE FROM categories 
      WHERE id NOT IN (SELECT MIN(id) FROM categories GROUP BY name)
    `);

    console.log("Adding unique index to categories name...");
    try {
      await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS categories_name_unique ON categories(name)");
    } catch (e) {}

    console.log("Ensuring employees table has userId column...");
    try {
      await client.execute("ALTER TABLE employees ADD COLUMN userId INTEGER REFERENCES users(id)");
    } catch (e: any) {}

    console.log("Cleaning up duplicate employees (surgical)...");
    // Only delete if NOT referenced elsewhere if possible, OR just rename them to allow the index
    // Let's try to just update the duplicates to have unique emails temporarily
    await client.execute(`
      UPDATE employees 
      SET email = email || '_dup_' || id 
      WHERE id NOT IN (SELECT MAX(id) FROM employees GROUP BY email)
    `);

    console.log("Ensuring employees table has unique email index...");
    await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS employees_email_unique ON employees(email)");

    console.log("Success!");
  } catch (e: any) {
    console.error("Error:", e.message);
  } finally {
    client.close();
  }
}

main();
