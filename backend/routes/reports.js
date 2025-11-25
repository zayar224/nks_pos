// backend/routes/reports.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/reports/sales", authMiddleware, async (req, res) => {
  const { start_date, end_date, branch_id } = req.query;
  const sales = await pool.query(
    "SELECT DATE(created_at) as date, SUM(total) as total FROM orders WHERE created_at BETWEEN ? AND ? AND branch_id = ? GROUP BY DATE(created_at)",
    [start_date, end_date, branch_id]
  );
  res.json(sales);
});
