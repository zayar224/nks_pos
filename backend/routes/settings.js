// backend/routes/settings.js
import express from "express";
import pool from "../db.js";
import { authMiddleware } from "./auth.js";

router.get("/currencies", authMiddleware, async (req, res) => {
  try {
    const [currencies] = await pool.query(
      "SELECT * FROM currencies WHERE branch_id = ? OR (branch_id IS NULL AND ? IS NULL)",
      [req.user.branch_id, req.user.branch_id]
    );
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch currencies" });
  }
});

router.post("/currencies", authMiddleware, async (req, res) => {
  const { code, exchange_rate } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO currencies (code, exchange_rate, branch_id) VALUES (?, ?, ?)",
      [code, exchange_rate, req.user.branch_id || null]
    );
    res.json({ id: result.insertId, code, exchange_rate });
  } catch (error) {
    res.status(500).json({ error: "Failed to add currency" });
  }
});

router.get("/payment-methods", authMiddleware, async (req, res) => {
  try {
    const [methods] = await pool.query(
      "SELECT * FROM payment_methods WHERE branch_id = ? OR (branch_id IS NULL AND ? IS NULL)",
      [req.user.branch_id, req.user.branch_id]
    );
    res.json(methods);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch payment methods" });
  }
});

router.post("/payment-methods", authMiddleware, async (req, res) => {
  const { name } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO payment_methods (name, branch_id) VALUES (?, ?)",
      [name, req.user.branch_id || null]
    );
    res.json({ id: result.insertId, name });
  } catch (error) {
    res.status(500).json({ error: "Failed to add payment method" });
  }
});
