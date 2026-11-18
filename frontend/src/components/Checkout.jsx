
import { useState } from "react";

export default function Checkout({ cart, onSuccess }) {
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    address: "",
    city: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    setCustomer({
      ...customer,
      [event.target.name]: event.target.value
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customer,
          items: cart.map((item) => ({
            id: item.id,
            quantity: item.quantity
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="checkoutPage">
      <h1>Checkout</h1>
      <p>Enter your delivery information.</p>

      <form onSubmit={handleSubmit} className="checkoutForm">
        <input
          name="name"
          placeholder="Full Name"
          value={customer.name}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email Address"
          value={customer.email}
          onChange={handleChange}
          required
        />

        <input
          name="address"
          placeholder="Street Address"
          value={customer.address}
          onChange={handleChange}
          required
        />

        <input
          name="city"
          placeholder="City"
          value={customer.city}
          onChange={handleChange}
          required
        />

        <div className="paymentNotice">
          Demo checkout — no payment will be charged.
        </div>

        {error && <p role="alert" className="error">{error}</p>}

        <button
          type="submit"
          className="checkoutBtn"
          disabled={loading || cart.length === 0}
        >
          {loading ? "Processing..." : "Place Order"}
        </button>
      </form>
    </section>
  );
}
