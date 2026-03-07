import mysql from "mysql2/promise";
import "dotenv/config";

async function test() {
    try {
        const url = process.env.DATABASE_URL || "mysql://root@localhost:3306/yaya_mart";
        console.log("Testing connection to:", url);
        const connection = await mysql.createConnection(url);
        console.log("Success!");
        await connection.end();
    } catch (err) {
        console.error("Failed:", err);
    }
}

test();
