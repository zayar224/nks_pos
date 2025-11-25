// backend/routes/admin.js
import express from "express";
import pool from "../db.js";
import { authMiddleware } from "./auth.js";

const router = express.Router();

// Tax Rates
router.get("/tax-rates", authMiddleware, async (req, res) => {
  try {
    const [taxRates] = await pool.query(
      "SELECT * FROM tax_rates WHERE shop_id = ?",
      [req.user.shop_id]
    );
    res.json(taxRates);
  } catch (err) {
    console.error("Error fetching tax rates:", err);
    res.status(500).json({ error: "Failed to fetch tax rates" });
  }
});

router.post("/tax-rates", authMiddleware, async (req, res) => {
  const { name, rate } = req.body;
  try {
    await pool.query(
      "INSERT INTO tax_rates (shop_id, name, rate) VALUES (?, ?, ?)",
      [req.user.shop_id, name, rate]
    );
    res.status(201).json({ message: "Tax rate added" });
  } catch (err) {
    console.error("Error adding tax rate:", err);
    res.status(500).json({ error: "Failed to add tax rate" });
  }
});

// Receipt Settings
router.get("/receipt-settings", authMiddleware, async (req, res) => {
  try {
    const [settings] = await pool.query(
      "SELECT * FROM receipt_settings WHERE store_id IN (SELECT id FROM stores WHERE branch_id IN (SELECT id FROM branches WHERE shop_id = ?))",
      [req.user.shop_id]
    );
    res.json(settings);
  } catch (err) {
    console.error("Error fetching receipt settings:", err);
    res.status(500).json({ error: "Failed to fetch receipt settings" });
  }
});

router.post("/receipt-settings", authMiddleware, async (req, res) => {
  const { store_id, logo_url, header_text, footer_text } = req.body;
  try {
    await pool.query(
      "INSERT INTO receipt_settings (store_id, logo_url, header_text, footer_text) VALUES (?, ?, ?, ?)",
      [store_id, logo_url, header_text, footer_text]
    );
    res.status(201).json({ message: "Receipt setting added" });
  } catch (err) {
    console.error("Error adding receipt setting:", err);
    res.status(500).json({ error: "Failed to add receipt setting" });
  }
});

// Promotions
router.get("/promotions", authMiddleware, async (req, res) => {
  try {
    const [promotions] = await pool.query(
      "SELECT * FROM promotions WHERE shop_id = ?",
      [req.user.shop_id]
    );
    res.json(promotions);
  } catch (err) {
    console.error("Error fetching promotions:", err);
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
});

router.post("/promotions", authMiddleware, async (req, res) => {
  const { name, type, value, start_date, end_date, product_ids, min_purchase } =
    req.body;
  try {
    await pool.query(
      "INSERT INTO promotions (shop_id, name, type, value, start_date, end_date, product_ids, min_purchase) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        req.user.shop_id,
        name,
        type,
        value,
        start_date,
        end_date,
        product_ids,
        min_purchase,
      ]
    );
    res.status(201).json({ message: "Promotion added" });
  } catch (err) {
    console.error("Error adding promotion:", err);
    res.status(500).json({ error: "Failed to add promotion" });
  }
});

router.delete("/promotions/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM promotions WHERE id = ? AND shop_id = ?", [
      req.params.id,
      req.user.shop_id,
    ]);
    res.json({ message: "Promotion deleted" });
  } catch (err) {
    console.error("Error deleting promotion:", err);
    res.status(500).json({ error: "Failed to delete promotion" });
  }
});

// Loyalty Tiers
router.get("/loyalty-tiers", authMiddleware, async (req, res) => {
  try {
    const [tiers] = await pool.query(
      "SELECT * FROM loyalty_tiers WHERE shop_id = ?",
      [req.user.shop_id]
    );
    res.json(tiers);
  } catch (err) {
    console.error("Error fetching loyalty tiers:", err);
    res.status(500).json({ error: "Failed to fetch loyalty tiers" });
  }
});

router.post("/loyalty-tiers", authMiddleware, async (req, res) => {
  const { name, min_points, point_multiplier } = req.body;
  // console.log("POST /api/loyalty-tiers request body:", req.body);
  if (!name || typeof name !== "string") {
    return res
      .status(400)
      .json({ error: "Name is required and must be a string" });
  }
  if (min_points == null || isNaN(min_points) || min_points < 0) {
    return res
      .status(400)
      .json({ error: "Minimum points must be a non-negative number" });
  }
  if (
    point_multiplier == null ||
    isNaN(point_multiplier) ||
    point_multiplier <= 0
  ) {
    return res
      .status(400)
      .json({ error: "Point multiplier must be a positive number" });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO loyalty_tiers (shop_id, name, min_points, point_multiplier) VALUES (?, ?, ?, ?)",
      [req.user.shop_id, name, min_points, point_multiplier]
    );
    res
      .status(201)
      .json({ message: "Loyalty tier added", id: result.insertId });
  } catch (err) {
    console.error("Error adding loyalty tier:", err);
    res.status(500).json({ error: "Failed to add loyalty tier" });
  }
});

router.delete("/loyalty-tiers/:id", authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM loyalty_tiers WHERE id = ? AND shop_id = ?",
      [req.params.id, req.user.shop_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Loyalty tier not found" });
    }
    res.json({ message: "Loyalty tier deleted" });
  } catch (err) {
    console.error("Error deleting loyalty tier:", err);
    res.status(500).json({ error: "Failed to delete loyalty tier" });
  }
});

// Employee Attendance
// In admin.js, update GET /employee-attendance
router.get("/employee-attendance", authMiddleware, async (req, res) => {
  try {
    const { user_id } = req.query;
    let query = `
      SELECT * FROM employee_attendance 
      WHERE branch_id IN (SELECT id FROM branches WHERE shop_id = ?)
    `;
    const params = [req.user.shop_id];
    if (user_id) {
      query += " AND user_id = ?";
      params.push(user_id);
    }
    const [records] = await pool.query(query, params);
    res.json(records);
  } catch (err) {
    console.error("Error fetching attendance records:", err);
    res.status(500).json({ error: "Failed to fetch attendance records" });
  }
});

router.post("/employee-attendance", authMiddleware, async (req, res) => {
  const { user_id, branch_id, clock_in } = req.body;
  // console.log("POST /api/employee-attendance request body:", req.body);
  if (!user_id || !branch_id || !clock_in) {
    return res
      .status(400)
      .json({ error: "User ID, Branch ID, and Clock In are required" });
  }
  const clockInDate = new Date(clock_in);
  if (isNaN(clockInDate.getTime())) {
    return res.status(400).json({ error: "Invalid Clock In date" });
  }
  try {
    const formattedClockIn = clockInDate
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    const [result] = await pool.query(
      "INSERT INTO employee_attendance (user_id, branch_id, clock_in) VALUES (?, ?, ?)",
      [user_id, branch_id, formattedClockIn]
    );
    res
      .status(201)
      .json({ message: "Attendance record added", id: result.insertId });
  } catch (err) {
    console.error("Error adding attendance record:", err);
    res.status(500).json({ error: "Failed to add attendance record" });
  }
});

router.put("/employee-attendance/:id", authMiddleware, async (req, res) => {
  const { clock_out } = req.body;
  // console.log("PUT /api/employee-attendance request body:", req.body);
  if (!clock_out) {
    return res.status(400).json({ error: "Clock Out is required" });
  }
  const clockOutDate = new Date(clock_out);
  if (isNaN(clockOutDate.getTime())) {
    return res.status(400).json({ error: "Invalid Clock Out date" });
  }
  try {
    const formattedClockOut = clockOutDate
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    const [result] = await pool.query(
      "UPDATE employee_attendance SET clock_out = ? WHERE id = ? AND branch_id IN (SELECT id FROM branches WHERE shop_id = ?)",
      [formattedClockOut, req.params.id, req.user.shop_id]
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Attendance record not found or not authorized" });
    }
    res.json({ message: "Attendance record updated" });
  } catch (err) {
    console.error("Error updating attendance record:", err);
    res.status(500).json({ error: "Failed to update attendance record" });
  }
});

// Audit Logs
router.get("/audit-logs", authMiddleware, async (req, res) => {
  const { user_id, entity_type, start_date, end_date } = req.query;
  let query = "SELECT * FROM audit_logs WHERE shop_id = ?";
  const params = [req.user.shop_id];
  if (user_id) {
    query += " AND user_id = ?";
    params.push(user_id);
  }
  if (entity_type) {
    query += " AND entity_type = ?";
    params.push(entity_type);
  }
  if (start_date) {
    query += " AND created_at >= ?";
    params.push(start_date);
  }
  if (end_date) {
    query += " AND created_at <= ?";
    params.push(end_date);
  }
  try {
    const [logs] = await pool.query(query, params);
    res.json(logs);
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// Stock Transfers
router.get("/stock-transfers", authMiddleware, async (req, res) => {
  try {
    const [transfers] = await pool.query(
      "SELECT * FROM stock_transfers WHERE from_branch_id IN (SELECT id FROM branches WHERE shop_id = ?) OR to_branch_id IN (SELECT id FROM branches WHERE shop_id = ?)",
      [req.user.shop_id, req.user.shop_id]
    );
    res.json(transfers);
  } catch (err) {
    console.error("Error fetching stock transfers:", err);
    res.status(500).json({ error: "Failed to fetch stock transfers" });
  }
});

router.post("/stock-transfers", authMiddleware, async (req, res) => {
  const { from_branch_id, to_branch_id, product_id, quantity, status } =
    req.body;
  try {
    await pool.query(
      "INSERT INTO stock_transfers (from_branch_id, to_branch_id, product_id, quantity, status) VALUES (?, ?, ?, ?, ?)",
      [from_branch_id, to_branch_id, product_id, quantity, status]
    );
    res.status(201).json({ message: "Stock transfer added" });
  } catch (err) {
    console.error("Error adding stock transfer:", err);
    res.status(500).json({ error: "Failed to add stock transfer" });
  }
});

router.put("/stock-transfers/:id", authMiddleware, async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query("UPDATE stock_transfers SET status = ? WHERE id = ?", [
      status,
      req.params.id,
    ]);
    res.json({ message: "Stock transfer updated" });
  } catch (err) {
    console.error("Error updating stock transfer:", err);
    res.status(500).json({ error: "Failed to update stock transfer" });
  }
});

// Users
router.get("/users", authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, username, email, role, shop_id, branch_id FROM users WHERE shop_id = ?",
      [req.user.shop_id]
    );
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
