// backend/routes/currencies.js
import express from "express";
import pool from "../db.js";
import { authMiddleware } from "./auth.js";

const router = express.Router();

// Get all active currencies for a shop
// Get all currencies
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM currencies");
    res.json(rows);
  } catch (error) {
    console.error("Currencies error:", error);
    res.status(500).json({ error: "Failed to fetch currencies" });
  }
});

export default router;
