// backend/server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import customerRoutes from "./routes/customers.js";
import paymentMethodRoutes from "./routes/payment_methods.js";
import currencyRoutes from "./routes/currencies.js";
import storeRoutes from "./routes/stores.js";
import receiptRoutes from "./routes/receipts.js";
import shopRoutes from "./routes/shops.js";
import salesReportRoutes from "./routes/reports/sales.js";
import branchRoutes from "./routes/branches.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  "/uploads/logos",
  express.static(path.join(__dirname, "uploads/logos"))
);
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${
      req.path
    } - Headers: ${JSON.stringify(req.headers)}`
  );
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/currencies", currencyRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/reports/sales", salesReportRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api", adminRoutes);

// Serve static files in production (optional, for serving frontend build)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));

  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
  });
}

app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(err.statusCode || 500).json({
    error: "Something went wrong!",
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
