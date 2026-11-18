export default function ProductCard({ product, onAddToCart }) {
  return (
    <article className="productCard">
      <div className="productCardImage">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
        />
        <span className="productBadge">NEW</span>
      </div>

      <div className="productCardContent">
        <p className="productCategory">{product.category}</p>
        <h3>{product.name}</h3>

        <div className="productCardBottom">
          <strong>${product.price.toFixed(2)}</strong>
          <button onClick={() => onAddToCart(product)}>
            Add to Bag +
          </button>
        </div>
      </div>
    </article>
  );
}
