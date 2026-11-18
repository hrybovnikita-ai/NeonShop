
const benefits = [
  {
    icon: "🚚",
    title: "Fast Shipping",
    description: "Free shipping on orders over $150."
  },
  {
    icon: "✦",
    title: "Premium Quality",
    description: "Carefully selected premium streetwear."
  },
  {
    icon: "↩",
    title: "Easy Returns",
    description: "Simple returns within 30 days."
  },
  {
    icon: "⚡",
    title: "Customer Support",
    description: "We're here to help with your orders."
  }
];

export default function Benefits() {
  return (
    <section className="benefitsSection">
      <div className="benefitsGrid">
        {benefits.map((benefit) => (
          <div className="benefitCard" key={benefit.title}>
            <div className="benefitIcon">{benefit.icon}</div>
            <h3>{benefit.title}</h3>
            <p>{benefit.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
