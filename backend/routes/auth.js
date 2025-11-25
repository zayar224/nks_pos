import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = express.Router();

// Middleware to verify JWT
export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      shop_id: decoded.shop_id || null,
      branch_id: decoded.branch_id || null,
    };
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Token expired", code: "TOKEN_EXPIRED" });
    }
    res.status(401).json({ error: "Invalid token" });
  }
};

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }
  try {
    const [users] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (users.length === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        shop_id: user.shop_id || null,
        branch_id: user.branch_id || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        shop_id: user.shop_id || null,
        branch_id: user.branch_id || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Logout
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    // Optional: Implement token blacklisting if needed
    // For stateless JWT, simply return success as the client will remove the token
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Failed to log out" });
  }
});

// Get all users (admin only)
router.get("/users", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const [users] = await pool.query(
      "SELECT id, username, email, role, shop_id, branch_id FROM users WHERE shop_id = ?",
      [req.user.shop_id]
    );
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Create user (admin only)
router.post("/users", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { username, email, password, role, shop_id, branch_id } = req.body;
  if (!username || !email || !password || !role) {
    return res
      .status(400)
      .json({ error: "Username, email, password, and role are required" });
  }
  const finalShopId = shop_id || req.user.shop_id;
  try {
    const [existing] = await pool.query(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, username]
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ error: "Email or username already exists" });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password_hash, role, shop_id, branch_id) VALUES (?, ?, ?, ?, ?, ?)",
      [username, email, password_hash, role, finalShopId, branch_id || null]
    );
    const [newUser] = await pool.query(
      "SELECT id, username, email, role, shop_id, branch_id FROM users WHERE id = ?",
      [result.insertId]
    );
    res.json(newUser[0]);
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update user (admin only)
router.put("/users/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { id } = req.params;
  const { username, email, role, shop_id, branch_id } = req.body;
  if (!username || !email || !role) {
    return res
      .status(400)
      .json({ error: "Username, email, and role are required" });
  }
  try {
    const [existing] = await pool.query(
      "SELECT * FROM users WHERE (email = ? OR username = ?) AND id != ?",
      [email, username, id]
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ error: "Email or username already exists" });
    }
    const [user] = await pool.query(
      "SELECT shop_id FROM users WHERE id = ? AND shop_id = ?",
      [id, req.user.shop_id]
    );
    if (!user[0]) {
      return res.status(404).json({ error: "User not found or unauthorized" });
    }
    const [result] = await pool.query(
      "UPDATE users SET username = ?, email = ?, role = ?, shop_id = ?, branch_id = ? WHERE id = ? AND shop_id = ?",
      [
        username,
        email,
        role,
        shop_id || req.user.shop_id,
        branch_id || null,
        id,
        req.user.shop_id,
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found or unauthorized" });
    }
    const [updatedUser] = await pool.query(
      "SELECT id, username, email, role, shop_id, branch_id FROM users WHERE id = ?",
      [id]
    );
    res.json(updatedUser[0]);
  } catch (error) {
    console.error("Update user error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ error: "Email or username already exists" });
    }
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete user (admin only)
router.delete("/users/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { id } = req.params;
  try {
    const [existing] = await pool.query(
      "SELECT id, shop_id FROM users WHERE id = ? AND shop_id = ?",
      [id, req.user.shop_id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const [result] = await pool.query(
      "DELETE FROM users WHERE id = ? AND shop_id = ?",
      [id, req.user.shop_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Get current user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, username, email, role, shop_id, branch_id FROM users WHERE id = ?",
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: users[0] });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
});

// Update current user
router.put("/me", authMiddleware, async (req, res) => {
  const { email, username } = req.body;
  if (!email || !username) {
    return res.status(400).json({ error: "Username and email are required" });
  }
  try {
    const [existing] = await pool.query(
      "SELECT * FROM users WHERE (email = ? OR username = ?) AND id != ?",
      [email, username, req.user.id]
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ error: "Email or username already exists" });
    }
    const [result] = await pool.query(
      "UPDATE users SET email = ?, username = ? WHERE id = ?",
      [email, username, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const [updatedUser] = await pool.query(
      "SELECT id, username, email, role, shop_id, branch_id FROM users WHERE id = ?",
      [req.user.id]
    );
    res.json({ user: updatedUser[0] });
  } catch (error) {
    console.error("Update user error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ error: "Email or username already exists" });
    }
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.get("/validate-session", authMiddleware, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      shop_id: req.user.shop_id,
      branch_id: req.user.branch_id,
    },
  });
});

export default router;
