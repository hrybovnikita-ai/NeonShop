
import { useEffect, useState } from "react";
import "./App.css";

import Navbar from "./components/Navbar";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import ProductCard from "./components/ProductCard";
import Benefits from "./components/Benefits";
import Footer from "./components/Footer";

const categories = [
  "All",
  "Hoodies",
  "T-Shirts",
  "Jackets",
  "Sneakers",
];

function loadCart() {
  try {
    const saved = localStorage.getItem("neonshop_cart");
    const parsed = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item) =>
          item &&
          Number.isInteger(item.id) &&
          Number.isFinite(item.price) &&
          item.price >= 0
      )
      .map((item) => ({
        ...item,
        quantity: Math.min(
          20,
          Math.max(1, Number(item.quantity) || 1)
        ),
      }));
  } catch {
    return [];
  }
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("All");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState(loadCart);
  const [page, setPage] = useState("shop");
  const [completedOrder, setCompletedOrder] = useState(null);

  // Save shopping cart
  useEffect(() => {
    try {
      localStorage.setItem(
        "neonshop_cart",
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error("Failed to save cart:", error);
    }
  }, [cart]);

  // Load products from Express API
  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products", {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const contentType =
          response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error(
            "API returned HTML instead of JSON. Check Vite proxy."
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid products response");
        }

        setProducts(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Products loading error:", err);
          setError(err.message || "Failed to load products");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, []);

  // Filter products
  const filtered =
    category === "All"
      ? products
      : products.filter(
          (product) => product.category === category
        );

  // Cart calculations
  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const shipping =
    cart.length === 0 || subtotal >= 150 ? 0 : 10;

  const total = subtotal + shipping;

  // Add product
  function addToCart(product) {
    setCart((current) => {
      const existing = current.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: Math.min(
                  20,
                  item.quantity + 1
                ),
              }
            : item
        );
      }

      return [
        ...current,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  }

  // Update quantity
  function updateQuantity(id, quantity) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.min(
                  20,
                  Math.max(0, Number(quantity) || 0)
                ),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  // Remove product
  function removeFromCart(id) {
    setCart((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  // Clear cart
  function clearCart() {
    setCart([]);
  }

  // Order success
  function handleOrderSuccess(order) {
    setCompletedOrder(order);
    clearCart();
    navigate("success");
  }

  // Navigation
  function navigate(nextPage) {
    setPage(nextPage);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // Shared navbar for every page
  const navbar = (
    <Navbar
      cartCount={cartCount}
      onBagClick={() => navigate("cart")}
    />
  );

  // Cart page
  if (page === "cart") {
    return (
      <div className="shop">
        {navbar}

        <div className="pageContent">
          <button
            className="backBtn"
            onClick={() => navigate("shop")}
          >
            ← Back to Shop
          </button>

          <Cart
            cart={cart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            onCheckout={() => navigate("checkout")}
          />
        </div>

        <Footer />
      </div>
    );
  }

  // Checkout page
  if (page === "checkout") {
    return (
      <div className="shop">
        {navbar}

        <div className="pageContent">
          <button
            className="backBtn"
            onClick={() => navigate("cart")}
          >
            ← Back to Cart
          </button>

          <div className="checkoutHeader">
            <h1>Secure Checkout</h1>
            <p>Complete your demo order securely.</p>
          </div>

          {cart.length === 0 ? (
            <div className="checkoutPage">
              <h2>Your shopping bag is empty.</h2>

              <button
                className="checkoutBtn"
                onClick={() => navigate("shop")}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <Checkout
              cart={cart}
              onSuccess={handleOrderSuccess}
            />
          )}
        </div>

        <Footer />
      </div>
    );
  }

  // Order success page
  if (page === "success") {
    return (
      <div className="shop">
        {navbar}

        <section className="successPage">
          <h1>Order Received!</h1>

          <p>
            Your order has been successfully submitted.
          </p>

          <p>
            Order ID:
            <strong>
              {" "}
              {completedOrder?.orderId}
            </strong>
          </p>

          <h2>
            Total: $
            {Number(
              completedOrder?.total ?? 0
            ).toFixed(2)}
          </h2>

          <p>
            This is a demo order.
            No real payment has been collected.
          </p>

          <button
            className="checkoutBtn"
            onClick={() => navigate("shop")}
          >
            Continue Shopping
          </button>
        </section>

        <Footer />
      </div>
    );
  }

  // Main store
  return (
    <div className="shop">

      {/* NAVBAR AT THE TOP */}
      {navbar}

      {/* HERO */}
      <section id="home" className="hero">
        <p className="eyebrow">
          NEW SEASON / 2026
        </p>

        <h1>
          DEFINE YOUR
          <br />
          <span>OWN STYLE.</span>
        </h1>

        <p>
          Premium essentials.
          Streetwear without limits.
        </p>

        <a className="shopButton" href="#shop">
          Explore Collection →
        </a>
      </section>

      {/* PRODUCTS */}
      <main id="shop">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">
              CURATED FOR YOU
            </p>

            <h2>Latest Collection</h2>
          </div>

          <p>{filtered.length} products</p>
        </div>

        {/* CATEGORY FILTERS */}
        <div className="filters">
          {categories.map((item) => (
            <button
              key={item}
              className={
                category === item ? "active" : ""
              }
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {/* LOADING */}
        {loading && (
          <p className="loading">
            Loading products...
          </p>
        )}

        {/* ERROR */}
        {error && (
          <div role="alert" className="error">
            <p>Failed to load products.</p>
            <p>{error}</p>
            <p>
              Make sure the Backend is running
              on localhost:5000 and the Vite
              proxy is configured correctly.
            </p>
          </div>
        )}

        {/* EMPTY CATEGORY */}
        {!loading &&
          !error &&
          filtered.length === 0 && (
            <p className="emptyProducts">
              No products found in this category.
            </p>
          )}

        {/* PRODUCT GRID */}
        <div className="productGrid">
          {!loading &&
            !error &&
            filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
        </div>
      </main>

      {/* SHOPPING BAG SUMMARY */}
      <section className="bagSummary">
        <span>
          Shopping Bag — {cartCount} items
        </span>

        <strong>
          Total: ${total.toFixed(2)}
        </strong>

        <button
          className="checkoutBtn"
          onClick={() => navigate("cart")}
          disabled={cartCount === 0}
        >
          View Bag →
        </button>
      </section>

      {/* ABOUT */}
      <section id="about">
        <Benefits />
      </section>

      {/* CONTACT */}
      <div id="contact">
        <Footer />
      </div>
    </div>
  );
}
