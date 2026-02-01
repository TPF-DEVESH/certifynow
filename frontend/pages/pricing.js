import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Pricing() {
  return (
    <>
      <Navbar />
      <div style={{ padding: 60, textAlign: "center" }}>
        <h1>Pricing</h1>

        <div style={grid}>
          <Plan title="Free" price="$0" features={["100/day", "Platform Email"]} />
          <Plan title="Pro 15 Days" price="$5" features={["1000 emails", "Custom SMTP"]} />
          <Plan title="Pro Monthly" price="$8" features={["1000 emails", "Custom SMTP"]} />
        </div>
      </div>
      <Footer />
    </>
  );
}

function Plan({ title, price, features }) {
  return (
    <div style={card}>
      <h2>{title}</h2>
      <h3>{price}</h3>
      <ul>{features.map(f => <li key={f}>{f}</li>)}</ul>
    </div>
  );
}

const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20 };
const card = { background: "#fff", padding: 30, borderRadius: 10 };
