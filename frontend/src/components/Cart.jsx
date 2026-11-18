
export default function Cart({
  cart,
  updateQuantity,
  removeFromCart,
  onCheckout
}) {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const shipping = subtotal >= 150 ? 0 : 10;
  const total = subtotal + (cart.length ? shipping : 0);

  return (
    <section className="cartPage">
      <h1>Shopping Bag</h1>

      {cart.length === 0 ? (
        <p>Your shopping bag is empty.</p>
      ) : (
        <>
          {cart.map((item) => (
            <div className="cartItem" key={item.id}>
              <img src={item.image} alt={item.name} />

              <div className="cartInfo">
                <h3>{item.name}</h3>
                <p>${item.price.toFixed(2)}</p>

                <div className="quantity">
                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.quantity - 1)
                    }
                  >
                    −
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    disabled={item.quantity >= 20}
                    onClick={() =>
                      updateQuantity(item.id, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                </div>

                <button
                  className="removeBtn"
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="cartTotals">
            <p>Subtotal: ${subtotal.toFixed(2)}</p>
            <p>Shipping: ${shipping.toFixed(2)}</p>
            <h2>Total: ${total.toFixed(2)}</h2>

            <button className="checkoutBtn" onClick={onCheckout}>
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </section>
  );
}
