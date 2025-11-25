// backend/routes/receipts.js
import express from "express";
import pool from "../db.js";
import { authMiddleware } from "./auth.js";

const router = express.Router();

// Get receipt settings for a store
router.get("/:store_id", authMiddleware, async (req, res) => {
  const { store_id } = req.params;
  try {
    const [stores] = await pool.query(
      "SELECT id FROM stores WHERE id = ? AND branch_id = ?",
      [store_id, req.user.branch_id]
    );
    if (stores.length === 0) {
      return res.status(404).json({ error: "Store not found" });
    }
    const [rows] = await pool.query(
      "SELECT * FROM receipt_settings WHERE store_id = ?",
      [store_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Receipt settings not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Receipt settings error:", error);
    res.status(500).json({ error: "Failed to fetch receipt settings" });
  }
});

export default router;
