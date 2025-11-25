// backend/routes/reports/sales.js
import express from "express";
import pool from "../../db.js";
import { authMiddleware } from "../auth.js";

const router = express.Router();

router.get("/sales", authMiddleware, async (req, res) => {
  const { start_date, end_date, branch_id } = req.query;
  if (!start_date || !end_date || !branch_id) {
    return res
      .status(400)
      .json({ error: "Start date, end date, and branch ID are required" });
  }
  if (branch_id !== req.user.branch_id) {
    return res.status(403).json({ error: "Invalid branch ID" });
  }
  try {
    const [sales] = await pool.query(
      "SELECT DATE(created_at) as date, SUM(total) as total FROM orders WHERE created_at BETWEEN ? AND ? AND branch_id = ? AND shop_id = ? GROUP BY DATE(created_at)",
      [start_date, end_date, branch_id, req.user.shop_id]
    );
    res.json(
      sales.map((sale) => ({
        date: sale.date,
        total: parseFloat(sale.total ?? 0),
      }))
    );
  } catch (error) {
    console.error("Sales report error:", error);
    res.status(500).json({ error: "Failed to fetch sales report" });
  }
});

export default router;
