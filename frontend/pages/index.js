import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Navbar />
      <section style={hero}>
        <h1>Automate Certificate Creation & Delivery</h1>
        <p>
          Upload a certificate, add a CSV, and send personalized certificates
          in minutes.
        </p>
        <Link href="/signup">
          <button style={cta}>Get Started Free</button>
        </Link>
      </section>

      <section style={grid}>
        {["Bulk CSV Upload", "PDF & Image Support", "Email Automation", "Free Plan"].map(f => (
          <div key={f} style={card}>
            <h3>{f}</h3>
            <p>Save hours of manual work.</p>
          </div>
        ))}
      </section>
      <Footer />
    </>
  );
}

const hero = { padding: 80, textAlign: "center" };
const cta = { padding: "14px 28px", background: "#000", color: "#fff" };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20, padding: 40 };
const card = { background: "#fff", padding: 20, borderRadius: 8 };
