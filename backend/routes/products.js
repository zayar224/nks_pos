import express from "express";
import pool from "../db.js";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import { authMiddleware } from "./auth.js";
import { createCanvas } from "canvas";
import JsBarcode from "jsbarcode";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Use lowercase 'uploads' to match production directory
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  console.log(`Creating uploads directory at ${uploadsDir}`);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
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
    cb(new Error("Only .jpg, .jpeg, and .png files are allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("image");

// Serve static images with error handling
router.use("/images", (req, res, next) => {
  console.log(`Serving image: ${req.path}`);
  express.static(uploadsDir)(req, res, (err) => {
    if (err) {
      console.error(`Error serving image ${req.path}:`, err);
      return res.status(500).json({ error: "Failed to serve image" });
    }
    if (!res.headersSent) {
      console.warn(`Image not found: ${req.path}`);
      return res.status(404).json({ error: "Image not found" });
    }
    next();
  });
});

// Helper function to generate barcode image and save to disk
const generateAndSaveBarcodeImage = async (barcode, productId) => {
  const canvas = createCanvas(200, 100);
  JsBarcode(canvas, barcode, {
    format: "CODE128",
    displayValue: true,
    fontSize: 16,
    margin: 10,
  });
  const barcodeImagePath = path.join(
    uploadsDir,
    `barcode-${productId}-${Date.now()}.png`
  );
  const out = fs.createWriteStream(barcodeImagePath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  return new Promise((resolve, reject) => {
    out.on("finish", () => resolve(path.basename(barcodeImagePath)));
    out.on("error", reject);
  });
};

// Helper function to parse product data
const parseProduct = (product) => ({
  ...product,
  original_price: parseFloat(product.original_price ?? 0),
  price: parseFloat(product.price ?? 0),
  stock: parseInt(product.stock ?? 0),
  is_weighted: !!product.is_weighted,
  image_url: product.image_url
    ? product.image_url.startsWith("https")
      ? product.image_url
      : `${process.env.APP_URL || "http://localhost:5200"}/api/products/images/${product.image_url}`
    : null,
  barcode_image_url: product.barcode_image_url
    ? `${process.env.APP_URL || "http://localhost:5200"}/api/products/images/${product.barcode_image_url}`
    : null,
  tax_rates: product.tax_rates ? product.tax_rates.split(",").map(Number) : [],
});

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer error:", err);
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }
  if (err.message === "Only .jpg, .jpeg, and .png files are allowed") {
    console.error("File type error:", err);
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

// Get all tax rates
router.get("/tax-rates", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM tax_rates WHERE shop_id = ?",
      [req.user.shop_id]
    );
    res.json(rows);
  } catch (error) {
    console.error("Tax rates error:", error);
    res.status(500).json({ error: "Failed to fetch tax rates" });
  }
});

// Create a tax rate
router.post("/tax-rates", authMiddleware, async (req, res) => {
  const { name, rate } = req.body;
  if (!name || rate == null) {
    return res.status(400).json({ error: "Name and rate are required" });
  }
  if (rate < 0 || rate > 100) {
    return res.status(400).json({ error: "Rate must be between 0 and 100" });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query(
      "INSERT INTO tax_rates (shop_id, name, rate) VALUES (?, ?, ?)",
      [req.user.shop_id, name, rate]
    );
    const newTaxRateId = result.insertId;

    const [products] = await connection.query(
      "SELECT id FROM products WHERE shop_id = ?",
      [req.user.shop_id]
    );
    const productTaxValues = products.map((product) => [
      product.id,
      newTaxRateId,
    ]);
    if (productTaxValues.length > 0) {
      await connection.query(
        "INSERT INTO product_taxes (product_id, tax_rate_id) VALUES ?",
        [productTaxValues]
      );
    }

    const [newTaxRate] = await connection.query(
      "SELECT * FROM tax_rates WHERE id = ?",
      [newTaxRateId]
    );
    await connection.commit();
    res.json(newTaxRate[0]);
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error creating tax rate:", error);
    res.status(500).json({ error: "Failed to create tax rate" });
  } finally {
    if (connection) connection.release();
  }
});

// Update a tax rate
router.put("/tax-rates/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, rate } = req.body;
  if (!name || rate == null) {
    return res.status(400).json({ error: "Name and rate are required" });
  }
  if (rate < 0 || rate > 100) {
    return res.status(400).json({ error: "Rate must be between 0 and 100" });
  }
  try {
    const [result] = await pool.query(
      "UPDATE tax_rates SET name = ?, rate = ? WHERE id = ? AND shop_id = ?",
      [name, rate, id, req.user.shop_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Tax rate not found" });
    }
    const [updatedTaxRate] = await pool.query(
      "SELECT * FROM tax_rates WHERE id = ?",
      [id]
    );
    res.json(updatedTaxRate[0]);
  } catch (error) {
    console.error("Error updating tax rate:", error);
    res.status(500).json({ error: "Failed to update tax rate" });
  }
});

// Delete a tax rate
router.delete("/tax-rates/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM tax_rates WHERE id = ? AND shop_id = ?",
      [id, req.user.shop_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Tax rate not found" });
    }
    await pool.query("DELETE FROM product_taxes WHERE tax_rate_id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting tax rate:", error);
    res.status(500).json({ error: "Failed to delete tax rate" });
  }
});

// Associate tax rate with product
router.post("/products/:id/tax-rates", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { tax_rate_id } = req.body;
  if (!tax_rate_id) {
    return res.status(400).json({ error: "Tax rate ID is required" });
  }
  try {
    const [product] = await pool.query(
      "SELECT * FROM products WHERE id = ? AND shop_id = ?",
      [id, req.user.shop_id]
    );
    if (product.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    const [taxRate] = await pool.query(
      "SELECT * FROM tax_rates WHERE id = ? AND shop_id = ?",
      [tax_rate_id, req.user.shop_id]
    );
    if (taxRate.length === 0) {
      return res.status(404).json({ error: "Tax rate not found" });
    }
    await pool.query(
      "INSERT IGNORE INTO product_taxes (product_id, tax_rate_id) VALUES (?, ?)",
      [id, tax_rate_id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error associating tax rate:", error);
    res.status(500).json({ error: "Failed to associate tax rate" });
  }
});

// Remove tax rate from product
router.delete(
  "/products/:productId/tax-rates/:taxRateId",
  authMiddleware,
  async (req, res) => {
    const { productId, taxRateId } = req.params;
    try {
      const [result] = await pool.query(
        "DELETE FROM product_taxes WHERE product_id = ? AND tax_rate_id = ? AND EXISTS (SELECT 1 FROM products p WHERE p.id = ? AND p.shop_id = ?)",
        [productId, taxRateId, productId, req.user.shop_id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Association not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing tax rate:", error);
      res.status(500).json({ error: "Failed to remove tax rate" });
    }
  }
);

// Get all categories
router.get("/categories", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name FROM categories WHERE shop_id = ?",
      [req.user.shop_id]
    );
    res.json(rows);
  } catch (error) {
    console.error("Categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Create a category
router.post("/categories", authMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO categories (name, shop_id) VALUES (?, ?)",
      [name, req.user.shop_id]
    );
    const [newCategory] = await pool.query(
      "SELECT id, name FROM categories WHERE id = ?",
      [result.insertId]
    );
    res.json(newCategory[0]);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Update a category
router.put("/categories/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }
  try {
    const [result] = await pool.query(
      "UPDATE categories SET name = ? WHERE id = ? AND shop_id = ?",
      [name, id, req.user.shop_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    const [updatedCategory] = await pool.query(
      "SELECT id, name FROM categories WHERE id = ?",
      [id]
    );
    res.json(updatedCategory[0]);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// Delete a category
router.delete("/categories/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [products] = await pool.query(
      "SELECT id FROM products WHERE category_id = ? AND shop_id = ?",
      [id, req.user.shop_id]
    );
    if (products.length > 0) {
      return res
        .status(400)
        .json({ error: "Cannot delete category with associated products" });
    }
    const [result] = await pool.query(
      "DELETE FROM categories WHERE id = ? AND shop_id = ?",
      [id, req.user.shop_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// Get products
router.get("/", authMiddleware, async (req, res) => {
  const { category_id, barcode } = req.query;
  try {
    let query = `
      SELECT p.*, c.name AS category_name,
      (SELECT GROUP_CONCAT(t.rate SEPARATOR ',')
       FROM tax_rates t
       JOIN product_taxes pt ON t.id = pt.tax_rate_id
       WHERE pt.product_id = p.id) AS tax_rates
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.shop_id = ?
    `;
    let params = [req.user.shop_id];
    if (barcode) {
      query += " AND p.barcode = ?";
      params.push(barcode);
    } else if (category_id) {
      query += " AND p.category_id = ?";
      params.push(category_id);
    }
    const [rows] = await pool.query(query, params);
    res.json(rows.map(parseProduct));
  } catch (error) {
    console.error("Products error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get product by ID
router.get("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `
      SELECT p.*, c.name AS category_name,
      (SELECT GROUP_CONCAT(t.rate SEPARATOR ',')
       FROM tax_rates t
       JOIN product_taxes pt ON t.id = pt.tax_rate_id
       WHERE pt.product_id = p.id) AS tax_rates
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.shop_id = ?
    `,
      [id, req.user.shop_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(parseProduct(rows[0]));
  } catch (error) {
    console.error("Product error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Get product by barcode
router.get("/barcode/:barcode", authMiddleware, async (req, res) => {
  const { barcode } = req.params;
  try {
    const [rows] = await pool.query(
      `
      SELECT p.*, c.name AS category_name,
      (SELECT GROUP_CONCAT(t.rate SEPARATOR ',')
       FROM tax_rates t
       JOIN product_taxes pt ON t.id = pt.tax_rate_id
       WHERE pt.product_id = p.id) AS tax_rates
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.barcode = ? AND p.shop_id = ?
    `,
      [barcode, req.user.shop_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(parseProduct(rows[0]));
  } catch (error) {
    console.error("Barcode error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Create a product
router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next);
      next();
    });
  },
  async (req, res) => {
    const {
      name,
      original_price,
      price,
      stock,
      category_id,
      is_weighted,
      tax_rate_ids,
    } = req.body;
    const barcode = req.body.barcode || generateBarcode();
    const image_url = req.file ? req.file.filename : null;

    if (!name || original_price == null || price == null || stock == null) {
      if (image_url) {
        try {
          fs.unlinkSync(path.join(uploadsDir, image_url));
        } catch (err) {
          console.error("Error deleting uploaded image:", err);
        }
      }
      return res
        .status(400)
        .json({ error: "Name, original_price, price, and stock are required" });
    }
    if (
      parseFloat(original_price) < 0 ||
      parseFloat(price) < 0 ||
      parseInt(stock) < 0
    ) {
      if (image_url) {
        try {
          fs.unlinkSync(path.join(uploadsDir, image_url));
        } catch (err) {
          console.error("Error deleting uploaded image:", err);
        }
      }
      return res
        .status(400)
        .json({ error: "Original price, price, and stock cannot be negative" });
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [result] = await connection.query(
        `
        INSERT INTO products (name, original_price, price, stock, category_id, is_weighted, barcode, image_url, shop_id, barcode_image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          name,
          parseFloat(original_price),
          parseFloat(price),
          parseInt(stock),
          category_id || null,
          is_weighted === "true" || is_weighted === true,
          barcode,
          image_url,
          req.user.shop_id,
          null,
        ]
      );
      const productId = result.insertId;

      const barcodeImageFilename = await generateAndSaveBarcodeImage(
        barcode,
        productId
      );
      await connection.query(
        "UPDATE products SET barcode_image_url = ? WHERE id = ?",
        [barcodeImageFilename, productId]
      );

      if (tax_rate_ids && Array.isArray(JSON.parse(tax_rate_ids))) {
        const parsedTaxRateIds = JSON.parse(tax_rate_ids);
        const taxValues = parsedTaxRateIds.map((id) => [productId, id]);
        if (taxValues.length > 0) {
          await connection.query(
            "INSERT INTO product_taxes (product_id, tax_rate_id) VALUES ?",
            [taxValues]
          );
        }
      }

      const [newProduct] = await connection.query(
        `
        SELECT p.*, c.name AS category_name,
        (SELECT GROUP_CONCAT(t.rate SEPARATOR ',')
         FROM tax_rates t
         JOIN product_taxes pt ON t.id = pt.tax_rate_id
         WHERE pt.product_id = p.id) AS tax_rates
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `,
        [productId]
      );

      await connection.commit();
      console.log("Created product:", newProduct[0]);
      res.json(parseProduct(newProduct[0]));
    } catch (error) {
      if (connection) await connection.rollback();
      if (image_url) {
        try {
          fs.unlinkSync(path.join(uploadsDir, image_url));
        } catch (err) {
          console.error("Error deleting uploaded image:", err);
        }
      }
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    } finally {
      if (connection) connection.release();
    }
  }
);

// Update a product
router.put(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next);
      next();
    });
  },
  async (req, res) => {
    const { id } = req.params;
    const {
      name,
      original_price,
      price,
      stock,
      category_id,
      is_weighted,
      tax_rate_ids,
    } = req.body;
    const barcode = req.body.barcode || generateBarcode();
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [existing] = await connection.query(
        "SELECT image_url, barcode_image_url FROM products WHERE id = ? AND shop_id = ?",
        [id, req.user.shop_id]
      );
      if (existing.length === 0) {
        if (req.file) {
          try {
            fs.unlinkSync(path.join(uploadsDir, req.file.filename));
          } catch (err) {
            console.error("Error deleting uploaded image:", err);
          }
        }
        return res.status(404).json({ error: "Product not found" });
      }
      const image_url = req.file ? req.file.filename : existing[0].image_url;
      if (req.file && existing[0].image_url) {
        const oldImagePath = path.join(uploadsDir, existing[0].image_url);
        try {
          if (fs.existsSync(oldImagePath)) {
            console.log(`Deleting old image: ${oldImagePath}`);
            fs.unlinkSync(oldImagePath);
          }
        } catch (err) {
          console.error("Error deleting old image:", err);
        }
      }

      const barcodeImageFilename = await generateAndSaveBarcodeImage(
        barcode,
        id
      );
      if (existing[0].barcode_image_url) {
        const oldBarcodeImagePath = path.join(
          uploadsDir,
          existing[0].barcode_image_url
        );
        try {
          if (fs.existsSync(oldBarcodeImagePath)) {
            console.log(`Deleting old barcode image: ${oldBarcodeImagePath}`);
            fs.unlinkSync(oldBarcodeImagePath);
          }
        } catch (err) {
          console.error("Error deleting old barcode image:", err);
        }
      }

      const [result] = await connection.query(
        `
        UPDATE products
        SET name = ?, original_price = ?, price = ?, stock = ?, category_id = ?, is_weighted = ?, barcode = ?, image_url = ?, barcode_image_url = ?
        WHERE id = ? AND shop_id = ?
      `,
        [
          name,
          parseFloat(original_price),
          parseFloat(price),
          parseInt(stock),
          category_id || null,
          is_weighted === "true" || is_weighted === true,
          barcode,
          image_url,
          barcodeImageFilename,
          id,
          req.user.shop_id,
        ]
      );
      if (result.affectedRows === 0) {
        if (req.file) {
          try {
            fs.unlinkSync(path.join(UploadsDir, req.file.filename));
          } catch (err) {
            console.error("Error deleting uploaded image:", err);
          }
        }
        await connection.rollback();
        return res.status(404).json({ error: "Product not found" });
      }

      if (tax_rate_ids && Array.isArray(JSON.parse(tax_rate_ids))) {
        await connection.query(
          "DELETE FROM product_taxes WHERE product_id = ?",
          [id]
        );
        const parsedTaxRateIds = JSON.parse(tax_rate_ids);
        const taxValues = parsedTaxRateIds.map((taxId) => [id, taxId]);
        if (taxValues.length > 0) {
          await connection.query(
            "INSERT INTO product_taxes (product_id, tax_rate_id) VALUES ?",
            [taxValues]
          );
        }
      }

      const [updatedProduct] = await connection.query(
        `
        SELECT p.*, c.name AS category_name,
        (SELECT GROUP_CONCAT(t.rate SEPARATOR ',')
         FROM tax_rates t
         JOIN product_taxes pt ON t.id = pt.tax_rate_id
         WHERE pt.product_id = p.id) AS tax_rates
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `,
        [id]
      );

      await connection.commit();
      console.log("Updated product:", updatedProduct[0]);
      res.json(parseProduct(updatedProduct[0]));
    } catch (error) {
      if (connection) await connection.rollback();
      if (req.file) {
        try {
          fs.unlinkSync(path.join(uploadsDir, req.file.filename));
        } catch (err) {
          console.error("Error deleting uploaded image:", err);
        }
      }
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    } finally {
      if (connection) connection.release();
    }
  }
);

// Delete a product
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await pool.query(
      "SELECT image_url, barcode_image_url FROM products WHERE id = ? AND shop_id = ?",
      [id, req.user.shop_id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    if (existing[0].image_url) {
      const imagePath = path.join(uploadsDir, existing[0].image_url);
      try {
        if (fs.existsSync(imagePath)) {
          console.log(`Deleting image: ${imagePath}`);
          fs.unlinkSync(imagePath);
        }
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }
    if (existing[0].barcode_image_url) {
      const barcodeImagePath = path.join(
        uploadsDir,
        existing[0].barcode_image_url
      );
      try {
        if (fs.existsSync(barcodeImagePath)) {
          console.log(`Deleting barcode image: ${barcodeImagePath}`);
          fs.unlinkSync(barcodeImagePath);
        }
      } catch (err) {
        console.error("Error deleting barcode image:", err);
      }
    }
    await pool.query("DELETE FROM product_taxes WHERE product_id = ?", [id]);
    const [result] = await pool.query(
      "DELETE FROM products WHERE id = ? AND shop_id = ?",
      [id, req.user.shop_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    console.log("Deleted product:", id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Generate and serve barcode image
router.get("/:id/barcode-image", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT barcode, barcode_image_url FROM products WHERE id = ? AND shop_id = ?",
      [id, req.user.shop_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    if (rows[0].barcode_image_url) {
      const barcodeImagePath = path.join(uploadsDir, rows[0].barcode_image_url);
      if (fs.existsSync(barcodeImagePath)) {
        console.log(`Serving barcode image: ${barcodeImagePath}`);
        res.setHeader("Content-Type", "image/png");
        fs.createReadStream(barcodeImagePath).pipe(res);
        return;
      } else {
        console.warn(`Barcode image not found: ${barcodeImagePath}`);
      }
    }
    const barcode = rows[0].barcode;
    const canvas = createCanvas(200, 100);
    JsBarcode(canvas, barcode, {
      format: "CODE128",
      displayValue: true,
      fontSize: 16,
      margin: 10,
    });

    const imageBuffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.send(imageBuffer);
  } catch (error) {
    console.error("Error generating barcode image:", error);
    res.status(500).json({ error: "Failed to generate barcode image" });
  }
});

function generateBarcode() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${timestamp}-${random}`.toUpperCase();
}

export default router;