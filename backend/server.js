
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET must contain at least 32 characters"
  );
}

/* =====================================
   MIDDLEWARE
===================================== */

app.use(helmet());

app.use(
  cors({
    origin: /^http:\/\/(localhost|127\.0\.0\.1):\d+$/,
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

/* =====================================
   IN-MEMORY DATABASE (DEMO)
===================================== */

const users = new Map();
const orders = new Map();

/* =====================================
   PRODUCTS
===================================== */

const products = [
  {
    id: 1,
    name: "Oversized Black Hoodie",
    category: "Hoodies",
    price: 79,
    image:
      "https://placehold.co/600x700/242424/ffffff?text=Black+Hoodie",
  },
  {
    id: 2,
    name: "Essential White T-Shirt",
    category: "T-Shirts",
    price: 35,
    image:
      "https://placehold.co/600x700/e5e5e5/111111?text=White+T-Shirt",
  },
  {
    id: 3,
    name: "Premium Denim Jacket",
    category: "Jackets",
    price: 129,
    image:
      "https://placehold.co/600x700/303b50/ffffff?text=Denim+Jacket",
  },
  {
    id: 4,
    name: "Urban Sneakers",
    category: "Sneakers",
    price: 110,
    image:
      "https://placehold.co/600x700/333333/ffffff?text=Urban+Sneakers",
  },
];

/* =====================================
   HEALTH CHECK
===================================== */

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "NeonShop API",
    timestamp: new Date().toISOString(),
  });
});

/* =====================================
   PRODUCTS API
===================================== */

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.get("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);

  const product = products.find(
    (item) => item.id === id
  );

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  return res.json(product);
});

/* =====================================
   AUTH HELPERS
===================================== */

const COOKIE_NAME = "neonshop_session";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

function getPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function findUserById(id) {
  return [...users.values()].find(
    (user) => user.id === id
  );
}

function createSession(res, user) {
  const token = jwt.sign(
    {
      sub: user.id,
    },
    JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "1d",
    }
  );

  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });
}

function authenticate(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const payload = jwt.verify(
      token,
      JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    const user = findUserById(payload.sub);

    if (!user) {
      return res.status(401).json({
        message: "Session expired",
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired session",
    });
  }
}

/* =====================================
   REGISTER
===================================== */

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    const normalizedName =
      typeof name === "string"
        ? name.trim()
        : "";

    const normalizedEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";

    if (
      normalizedName.length < 2 ||
      normalizedName.length > 80
    ) {
      return res.status(400).json({
        message: "Name must contain 2-80 characters",
      });
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      ) ||
      normalizedEmail.length > 254
    ) {
      return res.status(400).json({
        message: "Enter a valid email address",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and at most 72 UTF-8 bytes",
      });
    }

    if (users.has(normalizedEmail)) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const user = {
      id: crypto.randomUUID(),
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.set(normalizedEmail, user);

    createSession(res, user);

    return res.status(201).json({
      message: "Account created successfully",
      user: getPublicUser(user),
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Registration failed",
    });
  }
});

/* =====================================
   LOGIN
===================================== */

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const normalizedEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";

    const user = users.get(normalizedEmail);

    if (
      !user ||
      typeof password !== "string" ||
      !(await bcrypt.compare(
        password,
        user.passwordHash
      ))
    ) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    createSession(res, user);

    return res.json({
      message: "Login successful",
      user: getPublicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed",
    });
  }
});

/* =====================================
   CURRENT USER
===================================== */

app.get("/api/auth/me", authenticate, (req, res) => {
  res.json({
    user: getPublicUser(req.user),
  });
});

/* =====================================
   LOGOUT
===================================== */

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

/* =====================================
   CREATE ORDER
===================================== */

app.post("/api/orders", (req, res) => {
  const { items, customer } = req.body || {};

  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 100
  ) {
    return res.status(400).json({
      error: "Invalid or empty cart",
    });
  }

  if (
    !customer ||
    typeof customer.name !== "string" ||
    !customer.name.trim() ||
    typeof customer.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      customer.email
    ) ||
    typeof customer.address !== "string" ||
    !customer.address.trim() ||
    typeof customer.city !== "string" ||
    !customer.city.trim()
  ) {
    return res.status(400).json({
      error: "Invalid customer details",
    });
  }

  const validatedItems = [];

  for (const item of items) {
    const product = products.find(
      (p) => p.id === item.id
    );

    if (
      !product ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 20
    ) {
      return res.status(400).json({
        error: "Invalid cart item",
      });
    }

    validatedItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
    });
  }

  const subtotal = validatedItems.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  const shipping = subtotal >= 150 ? 0 : 10;

  const total =
    Math.round(
      (subtotal + shipping) * 100
    ) / 100;

  const order = {
    id: crypto.randomUUID(),
    items: validatedItems,

    customer: {
      name: customer.name.trim(),
      email: customer.email.trim(),
      address: customer.address.trim(),
      city: customer.city.trim(),
    },

    subtotal,
    shipping,
    total,
    currency: "USD",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  orders.set(order.id, order);

  return res.status(201).json({
    orderId: order.id,
    total: order.total,
    currency: order.currency,
    status: order.status,
  });
});

/* =====================================
   404 HANDLER
===================================== */

app.use("/api", (req, res) => {
  res.status(404).json({
    message: "API endpoint not found",
  });
});

/* =====================================
   ERROR HANDLER
===================================== */

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    message: "Internal server error",
  });
});

/* =====================================
   START SERVER
===================================== */

app.listen(PORT, () => {
  console.log("");
  console.log("================================");
  console.log("       NEONSHOP BACKEND         ");
  console.log("================================");
  console.log(`API: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Products: http://localhost:${PORT}/api/products`);
  console.log("Authentication: enabled");
  console.log("Database: in-memory demo");
  console.log("================================");
});
