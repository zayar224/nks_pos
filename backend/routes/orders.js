// backend/routes/orders.js

import express from "express";
import pool from "../db.js";
import { authMiddleware } from "./auth.js";

const router = express.Router();

// Helper function to parse order data
async function logStatusChange(connection, orderId, status, userId) {
  await connection.query(
    "INSERT INTO order_status_logs (order_id, status, changed_by) VALUES (?, ?, ?)",
    [orderId, status, userId]
  );
}

function parseOrder(order, items = []) {
  return {
    ...order,
    total: parseFloat(order.total ?? 0),
    discount: parseFloat(order.discount ?? 0),
    tax_total: parseFloat(order.tax_total ?? 0),
    is_online: Boolean(order.is_online),
    is_refunded: Boolean(order.is_refunded),
    order_items: items.map((item) => ({
      ...item,
      price: parseFloat(item.price ?? 0),
      original_price: parseFloat(item.original_price ?? 0),
      discount: parseFloat(item.discount ?? 0),
      quantity: parseInt(item.quantity ?? 0),
      category_id: item.category_id ? parseInt(item.category_id) : null,
      category_name: item.category_name || null,
    })),
  };
}

// Order audit logs route (MUST come before /:id)
router.get("/order-audit-logs", authMiddleware, async (req, res) => {
  try {
    let query = `
      SELECT oal.*, u.username
      FROM order_audit_logs oal
      JOIN users u ON oal.user_id = u.id
      JOIN branches b ON u.branch_id = b.id
      WHERE oal.order_id REGEXP '^[0-9]+$'
    `;
    let params = [];

    if (req.user.role === "admin" || req.user.role === "shop_owner") {
      query += " AND b.shop_id = ?";
      params.push(req.user.shop_id);
    } else {
      if (!req.user.branch_id) {
        return res
          .status(403)
          .json({ error: "User is not assigned to a branch" });
      }
      query += " AND u.branch_id = ?";
      params.push(req.user.branch_id);
    }

    // console.log("Order audit logs query:", query, "Params:", params);
    const [logs] = await pool.query(query, params);
    res.json(logs);
  } catch (err) {
    console.error("Error fetching order audit logs:", err);
    res.status(500).json({ error: "Failed to fetch order audit logs" });
  }
});

// Create an order
router.post("/", authMiddleware, async (req, res) => {
  const {
    items,
    customer_id = null,
    discount = 0,
    payment_methods = [],
    currency_id = 1,
    use_loyalty_points = 0,
    is_online = false,
    pickup_time = null,
    store_id,
    branch_id,
    status = "completed",
    tax_total = 0,
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ error: "Items are required and must be a non-empty array" });
  }
  if (
    req.user.role !== "admin" &&
    req.user.role !== "shop_owner" &&
    branch_id !== req.user.branch_id
  ) {
    return res.status(403).json({ error: "Invalid branch ID" });
  }
  if (!store_id) {
    return res.status(400).json({ error: "Store ID is required" });
  }

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Validate store
      let storeQuery = "SELECT id, branch_id FROM stores WHERE id = ?";
      let storeParams = [store_id];
      if (req.user.role === "admin" || req.user.role === "shop_owner") {
        storeQuery +=
          " AND branch_id IN (SELECT id FROM branches WHERE shop_id = ?)";
        storeParams.push(req.user.shop_id);
      } else {
        storeQuery += " AND branch_id = ?";
        storeParams.push(req.user.branch_id);
      }
      const [store] = await connection.query(storeQuery, storeParams);
      if (!store[0]) {
        throw new Error("Invalid store ID or unauthorized access");
      }

      // Validate products and stock (skip for pending orders)
      if (status !== "pending") {
        const productIds = items.map((item) => item.id);
        const [products] = await connection.query(
          "SELECT id, stock, price FROM products WHERE id IN (?) AND shop_id = ?",
          [productIds, req.user.shop_id]
        );

        for (const item of items) {
          const product = products.find((p) => p.id === item.id);
          if (!product) {
            throw new Error(`Product ID ${item.id} not found or unauthorized`);
          }
          if (product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product ID ${item.id}`);
          }
          if (
            parseFloat(product.price).toFixed(2) !==
            parseFloat(item.price).toFixed(2)
          ) {
            throw new Error(`Price mismatch for product ID ${item.id}`);
          }
        }
      }

      // Validate currency
      const [currency] = await connection.query(
        "SELECT exchange_rate FROM currencies WHERE id = ?",
        [currency_id]
      );
      if (!currency[0]) {
        throw new Error("Invalid currency ID");
      }
      const exchangeRate = currency[0].exchange_rate || 1.0;

      // Calculate totals
      let subtotal = items.reduce(
        (sum, item) =>
          sum + item.price * item.quantity * (1 - (item.discount || 0) / 100),
        0
      );
      subtotal = subtotal * exchangeRate;

      let calculatedTaxTotal = items.reduce((sum, item) => {
        const taxRates = item.tax_rates || [];
        return (
          sum +
          taxRates.reduce(
            (taxSum, rate) =>
              taxSum + (item.price * item.quantity * rate) / 100,
            0
          )
        );
      }, 0);
      const effectiveTaxTotal = tax_total || calculatedTaxTotal;

      let total = (subtotal + effectiveTaxTotal) * (1 - discount / 100);

      // Handle loyalty points
      let pointsUsed = 0;
      if (status !== "pending" && customer_id && use_loyalty_points > 0) {
        const [customer] = await connection.query(
          "SELECT loyalty_points FROM customers WHERE id = ? AND shop_id = ?",
          [customer_id, req.user.shop_id]
        );
        if (!customer[0]) {
          throw new Error("Invalid customer ID or unauthorized");
        }
        pointsUsed = Math.min(
          use_loyalty_points,
          customer[0].loyalty_points,
          total * 100
        );
        total -= pointsUsed * 0.01;
        await connection.query(
          "UPDATE customers SET loyalty_points = loyalty_points - ? WHERE id = ?",
          [pointsUsed, customer_id]
        );
      }

      // Handle e-wallet
      let ewalletUsed = 0;
      if (status !== "pending" && customer_id && req.body.ewallet_amount > 0) {
        const [customer] = await connection.query(
          "SELECT ewallet_balance FROM customers WHERE id = ? AND shop_id = ?",
          [customer_id, req.user.shop_id]
        );
        if (!customer[0]) {
          throw new Error("Invalid customer ID or unauthorized");
        }
        ewalletUsed = Math.min(
          req.body.ewallet_amount,
          customer[0].ewallet_balance,
          total
        );
        total -= ewalletUsed;
        await connection.query(
          "UPDATE customers SET ewallet_balance = ewallet_balance - ? WHERE id = ?",
          [ewalletUsed, customer_id]
        );
      }

      // Validate payments
      if (status !== "pending") {
        const totalPaid = payment_methods.reduce(
          (sum, pm) => sum + parseFloat(pm.amount || 0),
          0
        );
        if (totalPaid + ewalletUsed < total) {
          throw new Error("Payment amounts do not cover total");
        }
      }

      // Insert order
      total = parseFloat(total.toFixed(2));
      const [result] = await connection.query(
        "INSERT INTO orders (total, customer_id, discount, currency_id, store_id, branch_id, status, is_online, pickup_time, tax_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          total,
          customer_id || null,
          discount,
          currency_id,
          store_id,
          branch_id,
          status,
          is_online,
          pickup_time || null,
          effectiveTaxTotal,
        ]
      );
      const orderId = result.insertId;

      // Log to audit_logs
      await connection.query(
        "INSERT INTO audit_logs (user_id, entity_type, entity_id, action, details, shop_id) VALUES (?, ?, ?, ?, ?, ?)",
        [
          req.user.id,
          "order",
          orderId,
          "create",
          JSON.stringify({
            total,
            customer_id,
            discount,
            store_id,
            branch_id,
            status,
            is_online,
          }),
          req.user.shop_id,
        ]
      );

      // Log status
      await logStatusChange(connection, orderId, status, req.user.id);

      // Insert order items
      for (const item of items) {
        await connection.query(
          "INSERT INTO order_items (order_id, product_id, quantity, discount, customer_note) VALUES (?, ?, ?, ?, ?)",
          [
            orderId,
            item.id,
            item.quantity,
            item.discount || 0,
            item.customer_note || null,
          ]
        );
        if (status !== "pending") {
          await connection.query(
            "UPDATE products SET stock = stock - ? WHERE id = ?",
            [item.quantity, item.id]
          );
        }
      }

      // Insert payments
      if (status !== "pending") {
        for (const pm of payment_methods) {
          await connection.query(
            "INSERT INTO order_payments (order_id, payment_method_id, amount) VALUES (?, ?, ?)",
            [orderId, pm.payment_method_id, pm.amount]
          );
        }
      }

      // Update loyalty points earned
      if (status !== "pending" && customer_id) {
        const pointsEarned = Math.floor(total);
        await connection.query(
          "UPDATE customers SET loyalty_points = loyalty_points + ? WHERE id = ?",
          [pointsEarned, customer_id]
        );
      }

      await connection.commit();
      return res.json({ id: orderId, tax_total: effectiveTaxTotal });
    } catch (error) {
      await connection.rollback();
      if (error.code === "ER_LOCK_WAIT_TIMEOUT" && attempt < maxRetries - 1) {
        attempt++;
        console.warn(
          `Retrying order creation for user ${req.user.id}, attempt ${
            attempt + 1
          }`
        );
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
        continue;
      }
      console.error("Order creation error:", error);
      return res.status(400).json({ error: error.message });
    } finally {
      connection.release();
    }
  }
});

// Create an order
router.get("/", authMiddleware, async (req, res) => {
  const {
    status,
    branch_id,
    start_date,
    end_date,
    category_id,
    page = 1,
    limit = 50,
  } = req.query;
  const offset = (page - 1) * limit;

  try {
    // Fetch orders
    let ordersQuery = `
      SELECT o.id, o.total, o.created_at, o.status, o.branch_id, o.discount, o.is_refunded, o.tax_total
      FROM orders o
      JOIN branches b ON o.branch_id = b.id
    `;
    let params = [];

    if (req.user.role === "admin" || req.user.role === "shop_owner") {
      ordersQuery += " WHERE b.shop_id = ?";
      params.push(req.user.shop_id);
    } else {
      if (!req.user.branch_id) {
        return res
          .status(403)
          .json({ error: "User is not assigned to a branch" });
      }
      ordersQuery += " WHERE o.branch_id = ?";
      params.push(req.user.branch_id);
    }

    if (status) {
      ordersQuery += " AND o.status = ?";
      params.push(status);
    }
    if (branch_id) {
      ordersQuery += " AND o.branch_id = ?";
      params.push(branch_id);
    }
    if (start_date) {
      ordersQuery += " AND o.created_at >= ?";
      params.push(start_date);
    }
    if (end_date) {
      ordersQuery += " AND o.created_at <= ?";
      params.push(end_date);
    }

    // Count total orders for pagination
    const countQuery = `SELECT COUNT(*) as total FROM (${ordersQuery}) as countQuery`;
    const [countResult] = await pool.query(countQuery, params);
    const totalOrders = countResult[0].total;

    // Add pagination
    ordersQuery += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    // console.log("Fetch orders query:", ordersQuery, "Params:", params);
    const [orders] = await pool.query(ordersQuery, params);

    // Fetch order items for all orders
    const orderIds = orders.map((order) => order.id);
    let orderItems = [];
    if (orderIds.length > 0) {
      let itemsQuery = `
        SELECT oi.order_id, oi.product_id, oi.quantity, oi.discount, 
               p.price, p.original_price, p.name, p.category_id, c.name AS category_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE oi.order_id IN (?)
      `;
      let itemsParams = [orderIds];

      if (category_id) {
        itemsQuery += " AND p.category_id = ?";
        itemsParams.push(category_id);
      }

      // console.log("Order items query:", itemsQuery, "Params:", itemsParams);
      const [items] = await pool.query(itemsQuery, itemsParams);
      orderItems = items;
    }

    // Combine orders with their items
    const ordersWithItems = orders.map((order) => {
      const items = orderItems
        .filter((item) => item.order_id === order.id)
        .map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          discount: item.discount,
          price: item.price,
          original_price: item.original_price,
          name: item.name,
          category_id: item.category_id,
          category_name: item.category_name,
        }));
      return parseOrder(order, items);
    });

    res.json({
      orders: ordersWithItems,
      pagination: {
        total: totalOrders,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalOrders / limit),
      },
    });
  } catch (error) {
    console.error("Fetch orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Get order history
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Default to page 1, 10 orders per page
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT 
        o.id, o.total, o.currency_id, o.store_id, o.status, 
        o.is_refunded, o.is_online, o.created_at, 
        c.name AS customer_name, c.id AS customer_id,
        s.name AS store_name, s.branch_id,
        cur.code AS currency_code
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      JOIN stores s ON o.store_id = s.id
      JOIN branches b ON s.branch_id = b.id
      JOIN currencies cur ON o.currency_id = cur.id
      WHERE 1=1
    `;
    let params = [];

    if (req.user.role === "admin" || req.user.role === "shop_owner") {
      query += " AND b.shop_id = ?";
      params.push(req.user.shop_id);
    } else {
      if (!req.user.branch_id) {
        return res
          .status(403)
          .json({ error: "User is not assigned to a branch" });
      }
      query += " AND o.branch_id = ?";
      params.push(req.user.branch_id);
    }

    // Add pagination
    query += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);

    // console.log("Order history query:", query, "Params:", params);
    const [orders] = await pool.query(query, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      JOIN stores s ON o.store_id = s.id
      JOIN branches b ON s.branch_id = b.id
      WHERE 1=1
      ${
        req.user.role === "admin" || req.user.role === "shop_owner"
          ? "AND b.shop_id = ?"
          : "AND o.branch_id = ?"
      }
    `;
    const [countResult] = await pool.query(countQuery, [
      req.user.role === "admin" || req.user.role === "shop_owner"
        ? req.user.shop_id
        : req.user.branch_id,
    ]);
    const totalOrders = countResult[0].total;
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    res.json({
      orders: orders.map((order) => parseOrder(order)),
      totalPages,
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error("Error fetching order history:", err);
    res.status(500).json({ error: "Failed to fetch order history" });
  }
});

// Process a refund
router.post("/refund", authMiddleware, async (req, res) => {
  const { order_id, amount, reason, refund_to_ewallet = false } = req.body;
  // console.log("Refund request:", {
  //   order_id,
  //   amount,
  //   reason,
  //   refund_to_ewallet,
  //   user: req.user,
  // });
  if (!order_id || !amount || amount <= 0 || !reason) {
    return res
      .status(400)
      .json({ error: "Order ID, amount, and reason are required" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let query = `
      SELECT o.*, b.shop_id
      FROM orders o
      JOIN branches b ON o.branch_id = b.id
      WHERE o.id = ?
    `;
    let params = [order_id];

    if (req.user.role === "admin" || req.user.role === "shop_owner") {
      query += " AND b.shop_id = ?";
      params.push(req.user.shop_id);
    } else {
      if (!req.user.branch_id) {
        throw new Error("User is not assigned to a branch");
      }
      query += " AND o.branch_id = ?";
      params.push(req.user.branch_id);
    }

    // console.log("Refund query:", query, "Params:", params);
    const [order] = await connection.query(query, params);
    if (!order[0]) {
      throw new Error("Order not found or unauthorized");
    }

    const orderTotal = parseFloat(order[0].total);
    if (parseFloat(amount) > orderTotal) {
      throw new Error(
        `Refund amount (${amount}) exceeds order total (${orderTotal})`
      );
    }

    await connection.query(
      "INSERT INTO refunds (order_id, amount, reason) VALUES (?, ?, ?)",
      [order_id, parseFloat(amount), reason]
    );

    // Log to audit_logs
    await connection.query(
      "INSERT INTO audit_logs (user_id, entity_type, entity_id, action, details, shop_id) VALUES (?, ?, ?, ?, ?, ?)",
      [
        req.user.id,
        "order",
        order_id,
        "refund",
        JSON.stringify({ amount, reason, refund_to_ewallet }),
        req.user.shop_id,
      ]
    );

    if (refund_to_ewallet && order[0].customer_id) {
      const [customer] = await connection.query(
        "SELECT id FROM customers WHERE id = ? AND shop_id = ?",
        [order[0].customer_id, req.user.shop_id]
      );
      if (!customer[0]) {
        throw new Error("Customer not found or unauthorized");
      }
      await connection.query(
        "UPDATE customers SET ewallet_balance = ewallet_balance + ? WHERE id = ?",
        [parseFloat(amount), order[0].customer_id]
      );
    }

    await connection.query(
      "UPDATE orders SET status = 'cancelled', is_refunded = TRUE WHERE id = ?",
      [order_id]
    );
    await logStatusChange(connection, order_id, "cancelled", req.user.id);

    const [items] = await connection.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [order_id]
    );
    for (const item of items) {
      await connection.query(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
        [item.quantity, item.product_id]
      );
    }

    if (order[0].customer_id) {
      const pointsDeducted = Math.floor(parseFloat(amount));
      await connection.query(
        "UPDATE customers SET loyalty_points = GREATEST(loyalty_points - ?, 0) WHERE id = ? AND shop_id = ?",
        [pointsDeducted, order[0].customer_id, req.user.shop_id]
      );
    }

    await connection.commit();
    // console.log("Refund processed successfully for order:", order_id);
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error("Refund error:", error.message);
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Get preparation orders
router.get("/preparation", authMiddleware, async (req, res) => {
  const { store_id, status, branch_id } = req.query;
  if (
    req.user.role !== "admin" &&
    req.user.role !== "shop_owner" &&
    branch_id &&
    branch_id !== req.user.branch_id
  ) {
    return res.status(403).json({ error: "Invalid branch ID" });
  }
  try {
    let query = `
      SELECT o.*, c.name AS customer_name, s.name AS store_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      JOIN stores s ON o.store_id = s.id
    `;
    let params = [];

    if (req.user.role === "admin" || req.user.role === "shop_owner") {
      query +=
        " WHERE o.is_online = TRUE AND o.status IN ('pending', 'preparing', 'prepared') AND o.branch_id IN (SELECT id FROM branches WHERE shop_id = ?)";
      params.push(req.user.shop_id);
    } else {
      if (!req.user.branch_id) {
        return res
          .status(403)
          .json({ error: "User is not assigned to a branch" });
      }
      query +=
        " WHERE o.is_online = TRUE AND o.status IN ('pending', 'preparing', 'prepared') AND o.branch_id = ?";
      params.push(req.user.branch_id);
    }

    if (store_id) {
      query += " AND o.store_id = ?";
      params.push(store_id);
    }
    if (status) {
      query += " AND o.status = ?";
      params.push(status);
    }
    query += " ORDER BY o.pickup_time ASC";
    // console.log("Preparation orders query:", query, "Params:", params);
    const [orders] = await pool.query(query, params);
    res.json(orders.map((order) => parseOrder(order, [])));
  } catch (error) {
    console.error("Preparation orders error:", error);
    res.status(500).json({ error: "Failed to retrieve preparation orders" });
  }
});

// Get order items
router.get("/:orderId/items", authMiddleware, async (req, res) => {
  const { orderId } = req.params;
  try {
    let query = `
      SELECT oi.*, p.name, p.price, p.original_price, p.barcode_image_url, p.category_id, c.name AS category_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      JOIN branches b ON o.branch_id = b.id
    `;
    let params = [orderId];

    if (req.user.role === "admin" || req.user.role === "shop_owner") {
      query += " WHERE oi.order_id = ? AND b.shop_id = ?";
      params.push(req.user.shop_id);
    } else {
      if (!req.user.branch_id) {
        return res
          .status(403)
          .json({ error: "User is not assigned to a branch" });
      }
      query += " WHERE oi.order_id = ? AND o.branch_id = ?";
      params.push(req.user.branch_id);
    }

    // console.log("Order items query:", query, "Params:", params);
    const [items] = await pool.query(query, params);
    const parsedItems = items.map((item) => ({
      ...item,
      price: parseFloat(item.price ?? 0),
      original_price: parseFloat(item.original_price ?? 0),
      discount: parseFloat(item.discount ?? 0),
      category_id: item.category_id ? parseInt(item.category_id) : null,
      category_name: item.category_name || null,
      barcode_image_url: item.barcode_image_url
        ? `${
            process.env.APP_URL || "http://localhost:5200"
          }/api/products/images/${item.barcode_image_url}`
        : null,
    }));
    res.json(parsedItems);
  } catch (error) {
    console.error("Order items error:", error);
    res.status(500).json({ error: "Failed to retrieve order items" });
  }
});

// Get order payments
router.get("/:orderId/payments", authMiddleware, async (req, res) => {
  const { orderId } = req.params;
  try {
    let query = `
      SELECT op.*, pm.name AS payment_method_name
      FROM order_payments op
      JOIN payment_methods pm ON op.payment_method_id = pm.id
      JOIN orders o ON op.order_id = o.id
      JOIN branches b ON o.branch_id = b.id
    `;
    let params = [orderId];

    if (req.user.role === "admin" || req.user.role === "shop_owner") {
      query += " WHERE op.order_id = ? AND b.shop_id = ?";
      params.push(req.user.shop_id);
    } else {
      if (!req.user.branch_id) {
        return res
          .status(403)
          .json({ error: "User is not assigned to a branch" });
      }
      query += " WHERE op.order_id = ? AND o.branch_id = ?";
      params.push(req.user.branch_id);
    }

    // console.log("Order payments query:", query, "Params:", params);
    const [payments] = await pool.query(query, params);
    const parsedPayments = payments.map((payment) => ({
      ...payment,
      amount: parseFloat(payment.amount ?? 0),
    }));
    res.json(parsedPayments);
  } catch (error) {
    console.error("Order payments error:", error);
    res.status(500).json({ error: "Failed to retrieve order payments" });
  }
});

// Process a refund
router.post("/refund", authMiddleware, async (req, res) => {
  const { order_id, amount, reason, refund_to_ewallet = false } = req.body;
  // console.log("Refund request:", {
  //   order_id,
  //   amount,
  //   reason,
  //   refund_to_ewallet,
  //   user: req.user,
  // });
  if (!order_id || !amount || amount <= 0 || !reason) {
    return res
      .status(400)
      .json({ error: "Order ID, amount, and reason are required" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let query = `
      SELECT o.*, b.shop_id
      FROM orders o
      JOIN branches b ON o.branch_id = b.id
      WHERE o.id = ?
    `;
    let params = [order_id];

    if (req.user.role === "admin" || req.user.role === "shop_owner") {
      query += " AND b.shop_id = ?";
      params.push(req.user.shop_id);
    } else {
      if (!req.user.branch_id) {
        throw new Error("User is not assigned to a branch");
      }
      query += " AND o.branch_id = ?";
      params.push(req.user.branch_id);
    }

    // console.log("Refund query:", query, "Params:", params);
    const [order] = await connection.query(query, params);
    if (!order[0]) {
      throw new Error("Order not found or unauthorized");
    }

    const orderTotal = parseFloat(order[0].total);
    if (parseFloat(amount) > orderTotal) {
      throw new Error(
        `Refund amount (${amount}) exceeds order total (${orderTotal})`
      );
    }

    await connection.query(
      "INSERT INTO refunds (order_id, amount, reason) VALUES (?, ?, ?)",
      [order_id, parseFloat(amount), reason]
    );

    // Log to audit_logs
    await connection.query(
      "INSERT INTO audit_logs (user_id, entity_type, entity_id, action, details, shop_id) VALUES (?, ?, ?, ?, ?, ?)",
      [
        req.user.id,
        "order",
        order_id,
        "refund",
        JSON.stringify({ amount, reason, refund_to_ewallet }),
        req.user.shop_id,
      ]
    );

    if (refund_to_ewallet && order[0].customer_id) {
      const [customer] = await connection.query(
        "SELECT id FROM customers WHERE id = ? AND shop_id = ?",
        [order[0].customer_id, req.user.shop_id]
      );
      if (!customer[0]) {
        throw new Error("Customer not found or unauthorized");
      }
      await connection.query(
        "UPDATE customers SET ewallet_balance = ewallet_balance + ? WHERE id = ?",
        [parseFloat(amount), order[0].customer_id]
      );
    }

    await connection.query(
      "UPDATE orders SET status = 'cancelled', is_refunded = TRUE WHERE id = ?",
      [order_id]
    );
    await logStatusChange(connection, order_id, "cancelled", req.user.id);

    const [items] = await connection.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [order_id]
    );
    for (const item of items) {
      await connection.query(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
        [item.quantity, item.product_id]
      );
    }

    if (order[0].customer_id) {
      const pointsDeducted = Math.floor(parseFloat(amount));
      await connection.query(
        "UPDATE customers SET loyalty_points = GREATEST(loyalty_points - ?, 0) WHERE id = ? AND shop_id = ?",
        [pointsDeducted, order[0].customer_id, req.user.shop_id]
      );
    }

    await connection.commit();
    // console.log("Refund processed successfully for order:", order_id);
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error("Refund error:", error.message);
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Mark order as prepared
router.post("/:orderId/complete", authMiddleware, async (req, res) => {
  const { orderId } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let query = `
      UPDATE orders 
      SET status = 'prepared' 
      WHERE id = ? AND is_online = TRUE AND status = 'preparing'
    `;
    let params = [orderId];

    if (req.user.role === "admin" || req.user.role === "shop_owner") {
      query += " AND branch_id IN (SELECT id FROM branches WHERE shop_id = ?)";
      params.push(req.user.shop_id);
    } else {
      if (!req.user.branch_id) {
        throw new Error("User is not assigned to a branch");
      }
      query += " AND branch_id = ?";
      params.push(req.user.branch_id);
    }

    // console.log("Complete order query:", query, "Params:", params);
    const [result] = await connection.query(query, params);
    if (result.affectedRows === 0) {
      throw new Error("Order not found or not preparing");
    }

    await logStatusChange(connection, orderId, "prepared", req.user.id);

    // Log to audit_logs
    await connection.query(
      "INSERT INTO audit_logs (user_id, entity_type, entity_id, action, details, shop_id) VALUES (?, ?, ?, ?, ?, ?)",
      [
        req.user.id,
        "order",
        orderId,
        "status_update",
        JSON.stringify({ status: "prepared" }),
        req.user.shop_id,
      ]
    );

    const [updatedOrder] = await connection.query(
      "SELECT o.*, c.name AS customer_name, s.name AS store_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id JOIN stores s ON o.store_id = s.id WHERE o.id = ?",
      [orderId]
    );

    await connection.commit();
    res.json(parseOrder(updatedOrder[0], []));
  } catch (error) {
    await connection.rollback();
    console.error("Error marking order as prepared:", error);
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Mark order as picked up (completed)
router.post("/:orderId/pickup", authMiddleware, async (req, res) => {
  const { orderId } = req.params;
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let query = `
        SELECT id, status, is_online 
        FROM orders 
        WHERE id = ?
      `;
      let params = [orderId];

      if (req.user.role === "admin" || req.user.role === "shop_owner") {
        query +=
          " AND branch_id IN (SELECT id FROM branches WHERE shop_id = ?)";
        params.push(req.user.shop_id);
      } else {
        if (!req.user.branch_id) {
          throw new Error("User is not assigned to a branch");
        }
        query += " AND branch_id = ?";
        params.push(req.user.branch_id);
      }

      // console.log("Pickup order query:", query, "Params:", params);
      const [orders] = await connection.query(query + " FOR UPDATE", params);

      if (!orders[0]) {
        throw new Error("Order not found or unauthorized");
      }
      if (orders[0].status !== "prepared" || !orders[0].is_online) {
        throw new Error(
          `Order not eligible for pickup (status: ${orders[0].status})`
        );
      }

      const [result] = await connection.query(
        "UPDATE orders SET status = ? WHERE id = ?",
        ["completed", orderId]
      );
      if (result.affectedRows === 0) {
        throw new Error("Failed to update order status");
      }

      await logStatusChange(connection, orderId, "completed", req.user.id);

      // Log to audit_logs
      await connection.query(
        "INSERT INTO audit_logs (user_id, entity_type, entity_id, action, details, shop_id) VALUES (?, ?, ?, ?, ?, ?)",
        [
          req.user.id,
          "order",
          orderId,
          "status_update",
          JSON.stringify({ status: "completed" }),
          req.user.shop_id,
        ]
      );

      const [updatedOrder] = await connection.query(
        "SELECT o.*, c.name AS customer_name, s.name AS store_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id JOIN stores s ON o.store_id = s.id WHERE o.id = ?",
        [orderId]
      );

      await connection.commit();
      return res.json(parseOrder(updatedOrder[0], []));
    } catch (error) {
      await connection.rollback();
      if (error.code === "ER_LOCK_WAIT_TIMEOUT" && attempt < maxRetries - 1) {
        attempt++;
        console.warn(
          `Retrying /pickup for order ${orderId}, attempt ${attempt + 1}`
        );
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
        continue;
      }
      console.error(`Error marking order ${orderId} as completed:`, error);
      return res.status(400).json({ error: error.message });
    } finally {
      connection.release();
    }
  }
});

// Delete an order
router.delete("/:orderId", authMiddleware, async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Fetch order with authorization check
    let query = `
      SELECT o.*, b.shop_id
      FROM orders o
      JOIN branches b ON o.branch_id = b.id
      WHERE o.id = ?
    `;
    let params = [orderId];

    if (req.user.role === "admin" || req.user.role === "shop_owner") {
      query += " AND b.shop_id = ?";
      params.push(req.user.shop_id);
    } else {
      if (!req.user.branch_id) {
        throw new Error("User is not assigned to a branch");
      }
      query += " AND o.branch_id = ?";
      params.push(req.user.branch_id);
    }

    // console.log("Delete order query:", query, "Params:", params);
    const [order] = await connection.query(query, params);
    if (!order[0]) {
      throw new Error("Order not found or unauthorized");
    }

    // Restrict deletion to pending, preparing, or prepared orders
    if (
      !["pending", "preparing", "prepared", "cancelled"].includes(
        order[0].status
      )
    ) {
      throw new Error(
        `Order is not eligible for deletion (current status: ${order[0].status})`
      );
    }

    // Restore product stock
    const [items] = await connection.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [orderId]
    );
    for (const item of items) {
      await connection.query(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
        [item.quantity, item.product_id]
      );
    }

    // Deduct loyalty points if applicable (skip for pending orders)
    if (order[0].customer_id && order[0].status !== "pending") {
      const pointsDeducted = Math.floor(parseFloat(order[0].total));
      await connection.query(
        "UPDATE customers SET loyalty_points = GREATEST(loyalty_points - ?, 0) WHERE id = ? AND shop_id = ?",
        [pointsDeducted, order[0].customer_id, req.user.shop_id]
      );
    }

    // Log deletion status
    await logStatusChange(connection, orderId, "deleted", req.user.id);

    // Log to audit_logs table
    await connection.query(
      "INSERT INTO audit_logs (user_id, entity_type, entity_id, action, details, shop_id) VALUES (?, ?, ?, ?, ?, ?)",
      [
        req.user.id,
        "order",
        orderId,
        "delete",
        JSON.stringify({ reason: reason || null }),
        req.user.shop_id, // Add shop_id from req.user
      ]
    );

    // Log to order_audit_logs (if reason is provided)
    if (reason) {
      await connection.query(
        "INSERT INTO order_audit_logs (order_id, action, reason, user_id) VALUES (?, ?, ?, ?)",
        [orderId, "delete", reason, req.user.id]
      );
    }

    // Delete related data
    await connection.query("DELETE FROM order_items WHERE order_id = ?", [
      orderId,
    ]);
    await connection.query("DELETE FROM order_payments WHERE order_id = ?", [
      orderId,
    ]);
    await connection.query("DELETE FROM refunds WHERE order_id = ?", [orderId]);
    await connection.query("DELETE FROM order_status_logs WHERE order_id = ?", [
      orderId,
    ]);
    await connection.query("DELETE FROM orders WHERE id = ?", [orderId]);

    await connection.commit();
    console.log(`Order ${orderId} deleted successfully`);
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error(`Error deleting order ${orderId}:`, error.message);
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const { period = "day" } = req.query;
    let query = `
      SELECT 
        SUM(total) as totalSales, 
        COUNT(*) as orderCount,
        DATE(created_at) as salesDate
      FROM orders
      WHERE status = 'completed'
    `;
    let params = [];

    if (req.user.role === "admin" || req.user.role === "shop_owner") {
      query += " AND branch_id IN (SELECT id FROM branches WHERE shop_id = ?)";
      params.push(req.user.shop_id);
    } else {
      if (!req.user.branch_id) {
        return res
          .status(403)
          .json({ error: "User is not assigned to a branch" });
      }
      query += " AND branch_id = ?";
      params.push(req.user.branch_id);
    }

    switch (period.toLowerCase()) {
      case "week":
        query += " GROUP BY YEAR(created_at), WEEK(created_at)";
        break;
      case "month":
        query += " GROUP BY YEAR(created_at), MONTH(created_at)";
        break;
      case "day":
      default:
        query += " GROUP BY DATE(created_at)";
        break;
    }

    query += " ORDER BY salesDate DESC LIMIT 30";
    // console.log("Stats query:", query, "Params:", params, "User:", req.user);
    const [results] = await pool.query(query, params);
    // console.log("Stats results:", results);

    const response = {
      totalSales: results.reduce(
        (sum, row) => sum + (parseFloat(row.totalSales) || 0),
        0
      ),
      orderCount: results.reduce(
        (sum, row) => sum + (parseInt(row.orderCount, 10) || 0),
        0
      ),
      salesData: results.map((row) => ({
        salesDate: row.salesDate,
        totalSales: parseFloat(row.totalSales || 0),
        orderCount: parseInt(row.orderCount || 0, 10),
      })),
    };
    // console.log("Stats response:", response);

    res.json(response);
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Cancel an order
router.post("/:orderId/cancel", authMiddleware, async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let query = `
      SELECT * 
      FROM orders 
      WHERE id = ? AND status IN ('pending', 'preparing')
    `;
    let params = [orderId];

    if (req.user.role === "admin" || req.user.role === "shop_owner") {
      query += " AND branch_id IN (SELECT id FROM branches WHERE shop_id = ?)";
      params.push(req.user.shop_id);
    } else {
      if (!req.user.branch_id) {
        throw new Error("User is not assigned to a branch");
      }
      query += " AND branch_id = ?";
      params.push(req.user.branch_id);
    }

    // console.log("Cancel order query:", query, "Params:", params);
    const [order] = await connection.query(query, params);
    if (!order[0]) {
      const [existingOrder] = await connection.query(
        "SELECT status, branch_id FROM orders WHERE id = ?",
        [orderId]
      );
      if (!existingOrder[0]) {
        throw new Error("Order not found");
      }
      if (
        req.user.role !== "admin" &&
        req.user.role !== "shop_owner" &&
        existingOrder[0].branch_id !== req.user.branch_id
      ) {
        throw new Error("Order belongs to a different branch");
      }
      throw new Error(
        `Order is not eligible for cancellation (current status: ${existingOrder[0].status})`
      );
    }

    await connection.query(
      "UPDATE orders SET status = 'cancelled' WHERE id = ?",
      [orderId]
    );
    await logStatusChange(connection, orderId, "cancelled", req.user.id);

    // Log to audit_logs
    await connection.query(
      "INSERT INTO audit_logs (user_id, entity_type, entity_id, action, details, shop_id) VALUES (?, ?, ?, ?, ?, ?)",
      [
        req.user.id,
        "order",
        orderId,
        "cancel",
        JSON.stringify({ reason: reason || null }),
        req.user.shop_id,
      ]
    );

    const [items] = await connection.query(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [orderId]
    );
    for (const item of items) {
      await connection.query(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
        [item.quantity, item.product_id]
      );
    }

    if (order[0].customer_id) {
      const pointsDeducted = Math.floor(order[0].total);
      await connection.query(
        "UPDATE customers SET loyalty_points = GREATEST(loyalty_points - ?, 0) WHERE id = ? AND shop_id = ?",
        [pointsDeducted, order[0].customer_id, req.user.shop_id]
      );
    }

    if (reason) {
      await connection.query(
        "INSERT INTO refunds (order_id, amount, reason) VALUES (?, ?, ?)",
        [orderId, order[0].total, reason]
      );
    }

    const [updatedOrder] = await connection.query(
      "SELECT o.*, c.name AS customer_name, s.name AS store_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id JOIN stores s ON o.store_id = s.id WHERE o.id = ?",
      [orderId]
    );

    await connection.commit();
    console.log(`Order ${orderId} cancelled successfully`);
    res.json(parseOrder(updatedOrder[0], []));
  } catch (error) {
    await connection.rollback();
    console.error(`Error cancelling order ${orderId}:`, error.message);
    res.status(400).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Get pending orders
router.get("/pending", authMiddleware, async (req, res) => {
  try {
    let query = `
      SELECT o.*, c.name AS customer_name, s.name AS store_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      JOIN stores s ON o.store_id = s.id
      WHERE o.status = 'pending'
    `;
    let params = [];

    if (req.user.role === "admin" || req.user.role === "shop_owner") {
      query +=
        " AND o.branch_id IN (SELECT id FROM branches WHERE shop_id = ?)";
      params.push(req.user.shop_id);
    } else {
      query += " AND (o.branch_id = ? OR (o.branch_id IS NULL AND ? IS NULL))";
      params.push(req.user.branch_id, req.user.branch_id);
    }

    // console.log("Pending orders query:", query, "Params:", params);
    const [orders] = await pool.query(query, params);

    const parsedOrders = await Promise.all(
      orders.map(async (order) => {
        const [items] = await pool.query(
          `
          SELECT oi.*, p.name, p.price, p.image_url, p.barcode_image_url, p.category_id, c.name AS category_name
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE oi.order_id = ?
        `,
          [order.id]
        );
        const parsedItems = items.map((item) => ({
          ...item,
          price: parseFloat(item.price ?? 0),
          discount: parseFloat(item.discount ?? 0),
          category_id: item.category_id ? parseInt(item.category_id) : null,
          category_name: item.category_name || null,
          barcode_image_url: item.barcode_image_url
            ? `${
                process.env.APP_URL || "http://localhost:5200"
              }/api/products/images/${item.barcode_image_url}`
            : null,
        }));
        return { ...parseOrder(order, []), items: parsedItems };
      })
    );

    res.json(parsedOrders);
  } catch (error) {
    console.error("Fetch pending orders error:", error);
    res.status(500).json({ error: "Failed to fetch pending orders" });
  }
});

// Update status (generic status update endpoint)
router.put("/:id/status", authMiddleware, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  try {
    let query = `
      UPDATE orders 
      SET status = ? 
      WHERE id = ?
    `;
    let params = [status, id];

    if (req.user.role === "admin" || req.user.role === "shop_owner") {
      query += " AND branch_id IN (SELECT id FROM branches WHERE shop_id = ?)";
      params.push(req.user.shop_id);
    } else {
      if (!req.user.branch_id) {
        return res
          .status(403)
          .json({ error: "User is not assigned to a branch" });
      }
      query += " AND branch_id = ?";
      params.push(req.user.branch_id);
    }

    // console.log("Update status query:", query, "Params:", params);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(query, params);
      if (result.affectedRows === 0) {
        throw new Error("Order not found or unauthorized");
      }

      // Log to audit_logs
      await connection.query(
        "INSERT INTO audit_logs (user_id, entity_type, entity_id, action, details, shop_id) VALUES (?, ?, ?, ?, ?, ?)",
        [
          req.user.id,
          "order",
          id,
          "status_update",
          JSON.stringify({ status }),
          req.user.shop_id,
        ]
      );

      await logStatusChange(connection, id, status, req.user.id);

      await connection.commit();
      res.json({ success: true });
    } catch (error) {
      await connection.rollback();
      console.error("Update order status error:", error);
      res.status(400).json({ error: error.message });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

router.get("/report/ordertotal", authMiddleware, async (req, res) => {
  // console.log("Report route hit - User:", req.user);
  try {
    let query = `
      SELECT SUM(total) as total_sales, COUNT(*) as order_count 
      FROM orders
    `;
    let params = [];

    if (req.user.role === "admin" || req.user.role === "shop_owner") {
      query +=
        " WHERE branch_id IN (SELECT id FROM branches WHERE shop_id = ?)";
      params.push(req.user.shop_id);
    } else {
      if (!req.user.branch_id) {
        return res
          .status(403)
          .json({ error: "User is not assigned to a branch" });
      }
      query += " WHERE branch_id = ?";
      params.push(req.user.branch_id);
    }

    query += " AND status = 'completed'";
    // console.log("Report query:", query, "Params:", params);
    const [orders] = await pool.query(query, params);
    // console.log("Report result:", orders);

    res.json({
      total_sales: parseFloat(
        orders.length > 0 ? orders[0].total_sales || 0 : 0
      ),
      order_count: parseInt(
        orders.length > 0 ? orders[0].order_count || 0 : 0,
        10
      ),
    });
  } catch (error) {
    console.error("Report error:", error);
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

// Get single order by ID (place AFTER /order-audit-logs)
router.get("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  // Validate that id is numeric
  if (!/^\d+$/.test(id)) {
    console.error(`Invalid Order ID received: ${id}`);
    return res.status(400).json({ error: "Order ID must be a valid number" });
  }
  try {
    let query = `
      SELECT o.*, s.name AS store_name, c.name AS customer_name, s.address AS address, s.phone AS phone
      FROM orders o
      LEFT JOIN stores s ON o.store_id = s.id
      LEFT JOIN customers c ON o.customer_id = c.id
      JOIN branches b ON o.branch_id = b.id
    `;
    let params = [];

    if (req.user.role === "admin" || req.user.role === "shop_owner") {
      query += " WHERE o.id = ? AND b.shop_id = ?";
      params.push(id, req.user.shop_id);
    } else {
      if (!req.user.branch_id) {
        return res
          .status(403)
          .json({ error: "User is not assigned to a branch" });
      }
      query += " WHERE o.id = ? AND o.branch_id = ?";
      params.push(id, req.user.branch_id);
    }

    // console.log("Order fetch query:", query, "Params:", params);
    const [orders] = await pool.query(query, params);
    if (orders.length === 0) {
      return res.status(404).json({ error: "Order not found or unauthorized" });
    }

    const [items] = await pool.query(
      `
      SELECT oi.*, p.name, p.price, p.original_price, p.barcode_image_url, p.category_id, c.name AS category_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE oi.order_id = ?
    `,
      [id]
    );
    const parsedItems = items.map((item) => ({
      ...item,
      price: parseFloat(item.price ?? 0),
      original_price: parseFloat(item.original_price ?? 0),
      discount: parseFloat(item.discount ?? 0),
      category_id: item.category_id ? parseInt(item.category_id) : null,
      category_name: item.category_name || null,
      barcode_image_url: item.barcode_image_url
        ? `${
            process.env.APP_URL || "http://localhost:5200"
          }/api/products/images/${item.barcode_image_url}`
        : null,
    }));

    const parsedOrder = parseOrder(orders[0], parsedItems);
    res.json({ ...parsedOrder, items: parsedItems });
  } catch (error) {
    console.error("Order fetch error:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

export default router;
