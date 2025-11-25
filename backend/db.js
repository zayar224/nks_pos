import mysql from "mysql2/promise";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import dotenv from "dotenv";

// Resolve path to .env file
dotenv.config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), "./.env"),
});

// Validate environment variables
const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_NAME"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(`Missing environment variables: ${missingVars.join(", ")}`);
  process.exit(1);
}

let pool; // Declare pool outside try block

try {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    connectTimeout: 10000,
    queueLimit: 0,
  });
} catch (error) {
  console.error("Failed to create database pool:", error);
  process.exit(1); // Exit only once
}

export default pool;
