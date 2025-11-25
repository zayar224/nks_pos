// backend/routes/payment_methods.js

import express from "express";
import pool from "../db.js";
import { authMiddleware } from "./auth.js";

const router = express.Router();

// Get all active payment methods
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM payment_methods WHERE is_active = TRUE"
    );
    res.json(rows);
  } catch (error) {
    console.error("Payment methods error:", error);
    res.status(500).json({ error: "Failed to fetch payment methods" });
  }
});

export default router;
