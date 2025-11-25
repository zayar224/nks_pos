// backend/routes/customers.js
import express from "express";
import pool from "../db.js";
import { authMiddleware } from "./auth.js";

const router = express.Router();

// Helper function to parse customer data
const parseCustomer = (customer) => {
  const ewalletBalance = parseFloat(customer.ewallet_balance ?? 0);
  return {
    ...customer,
    loyalty_points: parseInt(customer.loyalty_points ?? 0),
    ewallet_balance: isNaN(ewalletBalance) ? 0 : ewalletBalance,
  };
};

// Get all customers
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [customers] = await pool.query(
      "SELECT id, name, email, phone, loyalty_points, ewallet_balance, barcode FROM customers WHERE shop_id = ?",
      [req.user.shop_id]
    );
    res.json(customers.map(parseCustomer));
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// Get customer by barcode
router.get("/barcode/:barcode", authMiddleware, async (req, res) => {
  const { barcode } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, phone, loyalty_points, ewallet_balance, barcode FROM customers WHERE barcode = ? AND shop_id = ?",
      [barcode, req.user.shop_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(parseCustomer(rows[0]));
  } catch (error) {
    console.error("Error fetching customer by barcode:", error);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

// Get customer by ID
router.get("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, phone, loyalty_points, ewallet_balance, barcode FROM customers WHERE id = ? AND shop_id = ?",
      [id, req.user.shop_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(parseCustomer(rows[0]));
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

// Create a customer
router.post("/", authMiddleware, async (req, res) => {
  const {
    name,
    email,
    phone,
    loyalty_points = 0,
    ewallet_balance = 0,
  } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }
  if (loyalty_points < 0 || ewallet_balance < 0) {
    return res.status(400).json({
      error: "Loyalty points and e-wallet balance cannot be negative",
    });
  }
  try {
    const [existing] = await pool.query(
      "SELECT id FROM customers WHERE email = ? AND shop_id = ?",
      [email, req.user.shop_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const ewalletBalance = parseFloat(ewallet_balance);
    const [result] = await pool.query(
      "INSERT INTO customers (name, email, phone, loyalty_points, ewallet_balance, shop_id) VALUES (?, ?, ?, ?, ?, ?)",
      [
        name,
        email,
        phone || null,
        parseInt(loyalty_points),
        isNaN(ewalletBalance) ? 0 : ewalletBalance,
        req.user.shop_id,
      ]
    );
    const [newCustomer] = await pool.query(
      "SELECT id, name, email, phone, loyalty_points, ewallet_balance, barcode FROM customers WHERE id = ?",
      [result.insertId]
    );
    res.json(parseCustomer(newCustomer[0]));
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// Update a customer
router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, loyalty_points, ewallet_balance } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email must be provided" });
  }
  if (loyalty_points < 0 || ewallet_balance < 0) {
    return res.status(400).json({
      error: "Loyalty points and e-wallet balance cannot be negative",
    });
  }
  try {
    const [existing] = await pool.query(
      "SELECT id FROM customers WHERE email = ? AND id != ? AND shop_id = ?",
      [email, id, req.user.shop_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }
    const ewalletBalance = parseFloat(ewallet_balance);
    const [result] = await pool.query(
      "UPDATE customers SET name = ?, email = ?, phone = ?, loyalty_points = ?, ewallet_balance = ? WHERE id = ? AND shop_id = ?",
      [
        name,
        email,
        phone || null,
        parseInt(loyalty_points) || 0,
        isNaN(ewalletBalance) ? 0 : ewalletBalance,
        id,
        req.user.shop_id,
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    const [updatedCustomer] = await pool.query(
      "SELECT id, name, email, phone, loyalty_points, ewallet_balance, barcode FROM customers WHERE id = ?",
      [id]
    );
    res.json(parseCustomer(updatedCustomer[0]));
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ error: "Failed to update customer" });
  }
});

// Delete a customer
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM customers WHERE id = ? AND shop_id = ?",
      [id, req.user.shop_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ error: "Failed to delete customer" });
  }
});

export default router;
