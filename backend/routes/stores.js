// backend/routes/stores.js
import express from "express";
import pool from "../db.js";
import { authMiddleware } from "./auth.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const { name, branch_id } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO stores (name, branch_id) VALUES (?, ?)",
      [name, branch_id]
    );
    res.json({ id: result.insertId, name });
  } catch (error) {
    res.status(500).json({ error: "Failed to add store" });
  }
});

// Get all stores
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM stores WHERE branch_id = ?",
      [req.user.branch_id]
    );
    res.json(rows);
  } catch (error) {
    console.error("Stores error:", error);
    res.status(500).json({ error: "Failed to fetch stores" });
  }
});

export default router;
