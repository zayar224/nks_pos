// backend/routes/shops.js

import express from "express";
import pool from "../db.js";
import { authMiddleware } from "./auth.js";
import { fileURLToPath } from "url";
import multer from "multer";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png) are allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = express.Router();

// Get all shops with product count (admin only)
router.get("/", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const [shops] = await pool.query(
      `SELECT s.id, s.name, s.address, s.phone, s.logo_url, 
              COUNT(p.id) as product_count 
       FROM shops s 
       LEFT JOIN products p ON s.id = p.shop_id 
       GROUP BY s.id`
    );
    // console.log("Fetched shops:", shops);
    res.json(shops);
  } catch (error) {
    console.error("Shops fetch error:", error);
    res.status(500).json({ error: "Failed to fetch shops" });
  }
});

// Get on shop by id
router.get("/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const [shops] = await pool.query(
      `SELECT id, name, address, phone, logo_url 
       FROM shops 
       WHERE id = ?`,
      [req.params.id]
    );
    if (shops.length === 0) {
      return res.status(404).json({ error: "Shop not found" });
    }
    res.json(shops[0]);
  } catch (error) {
    console.error("Shop fetch error:", error);
    res.status(500).json({ error: "Failed to fetch shop" });
  }
});

// Create shop (admin only)
router.post("/", authMiddleware, upload.single("logo"), async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { name, address, phone } = req.body;
  const logo_url = req.file ? `/uploads/${req.file.filename}` : null;
  // console.log("Create shop request:", { name, address, phone, logo_url });
  if (!name || !address || !phone) {
    return res
      .status(400)
      .json({ error: "Name, address, and phone are required" });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO shops (name, address, phone, logo_url) VALUES (?, ?, ?, ?)",
      [name, address, phone, logo_url]
    );
    const [newShop] = await pool.query(
      `SELECT s.id, s.name, s.address, s.phone, s.logo_url, 
              COUNT(p.id) as product_count 
       FROM shops s 
       LEFT JOIN products p ON s.id = p.shop_id 
       WHERE s.id = ? 
       GROUP BY s.id`,
      [result.insertId]
    );
    console.log("Created shop:", newShop[0]);
    res.json(newShop[0]);
  } catch (error) {
    console.error("Create shop error:", error);
    res.status(500).json({ error: "Failed to create shop" });
  }
});

// Update shop (admin only)
router.put("/:id", authMiddleware, upload.single("logo"), async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { id } = req.params;
  const { name, address, phone } = req.body;
  const logo_url = req.file
    ? `/uploads/${req.file.filename}`
    : req.body.logo_url;
  // console.log("Update shop request:", { id, name, address, phone, logo_url });
  if (!name || !address || !phone) {
    return res
      .status(400)
      .json({ error: "Name, address, and phone are required" });
  }
  try {
    const [existing] = await pool.query(
      "SELECT id, logo_url FROM shops WHERE id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "Shop not found" });
    }
    // Delete old logo if new one is uploaded
    if (req.file && existing[0].logo_url) {
      const oldLogoPath = path.join(process.cwd(), existing[0].logo_url);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }
    const [result] = await pool.query(
      "UPDATE shops SET name = ?, address = ?, phone = ?, logo_url = ? WHERE id = ?",
      [name, address, phone, logo_url, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Shop not found" });
    }
    const [updatedShop] = await pool.query(
      `SELECT s.id, s.name, s.address, s.phone, s.logo_url, 
              COUNT(p.id) as product_count 
       FROM shops s 
       LEFT JOIN products p ON s.id = p.shop_id 
       WHERE s.id = ? 
       GROUP BY s.id`,
      [id]
    );
    console.log("Updated shop:", updatedShop[0]);
    res.json(updatedShop[0]);
  } catch (error) {
    console.error("Update shop error:", error);
    res.status(500).json({ error: "Failed to update shop" });
  }
});

// Delete shop (admin only)
router.delete("/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { id } = req.params;
  try {
    const [existing] = await pool.query(
      "SELECT id, logo_url FROM shops WHERE id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "Shop not found" });
    }
    // Delete logo file
    if (existing[0].logo_url) {
      const logoPath = path.join(process.cwd(), existing[0].logo_url);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }
    const [result] = await pool.query("DELETE FROM shops WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Shop not found" });
    }
    console.log("Deleted shop:", id);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete shop error:", error);
    res.status(500).json({ error: "Failed to delete shop" });
  }
});

export default router;
