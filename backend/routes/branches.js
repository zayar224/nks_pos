// backend/routes/branches.js
import express from "express";
import pool from "../db.js";
import { authMiddleware } from "./auth.js";

const router = express.Router();

// Get all branches for the user's shop
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [branches] = await pool.query(
      "SELECT id, shop_id, name, address, phone, created_at FROM branches WHERE shop_id = ?",
      [req.user.shop_id]
    );
    res.json(branches);
  } catch (err) {
    console.error("Error fetching branches:", err);
    res.status(500).json({ error: "Failed to fetch branches" });
  }
});

// Create a new branch
router.post("/", authMiddleware, async (req, res) => {
  const { name, address, phone } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO branches (shop_id, name, address, phone) VALUES (?, ?, ?, ?)",
      [req.user.shop_id, name, address, phone]
    );
    res.status(201).json({ id: result.insertId, name, address, phone });
  } catch (err) {
    console.error("Error creating branch:", err);
    res.status(500).json({ error: "Failed to create branch" });
  }
});

// Update a branch
router.put("/:id", authMiddleware, async (req, res) => {
  const { name, address, phone } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE branches SET name = ?, address = ?, phone = ? WHERE id = ? AND shop_id = ?",
      [name, address, phone, req.params.id, req.user.shop_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Branch not found" });
    }
    res.json({ message: "Branch updated" });
  } catch (err) {
    console.error("Error updating branch:", err);
    res.status(500).json({ error: "Failed to update branch" });
  }
});

// Delete a branch
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM branches WHERE id = ? AND shop_id = ?",
      [req.params.id, req.user.shop_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Branch not found" });
    }
    res.json({ message: "Branch deleted" });
  } catch (err) {
    console.error("Error deleting branch:", err);
    res.status(500).json({ error: "Failed to delete branch" });
  }
});

export default router;
