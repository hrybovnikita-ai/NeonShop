
export default function Footer() {
  return (
    <footer className="siteFooter" id="about">
      <div className="footerGrid">
        <div className="footerBrand">
          <h2>NEON<span>SHOP</span></h2>
          <p>
            Premium streetwear for the next generation.
            Define your style. Wear your identity.
          </p>
        </div>

        <div className="footerColumn">
          <h3>Shop</h3>
          <a href="/#products">All Products</a>
          <a href="/#products">Hoodies</a>
          <a href="/#products">T-Shirts</a>
          <a href="/#products">Sneakers</a>
        </div>

        <div className="footerColumn">
          <h3>Information</h3>
          <a href="mailto:support@example.com">
            Customer Support
          </a>
          <span>Shipping Information</span>
          <span>Returns & Exchanges</span>
          <span>Privacy Policy</span>
        </div>

        <div className="footerColumn">
          <h3>Contact Us</h3>
          <p>Email: support@example.com</p>
          <p>Location: Online Store</p>
          <p>Support: Mon–Fri</p>
          <p>Instagram · TikTok · Telegram</p>
        </div>
      </div>

      <div className="footerBottom">
        <p>© 2026 NeonShop. All rights reserved.</p>
        <p>Designed with React + Node.js</p>
      </div>
    </footer>
  );
}
