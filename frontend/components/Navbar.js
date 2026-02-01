import Link from "next/link";

export default function Navbar() {
  return (
    <nav style={nav}>
      <strong>CertifyNow</strong>
      <div style={links}>
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/login">Login</Link>
      </div>
    </nav>
  );
}

const nav = {
  display: "flex",
  justifyContent: "space-between",
  padding: "20px 40px",
  background: "#fff",
  boxShadow: "0 2px 6px rgba(0,0,0,.05)"
};

const links = {
  display: "flex",
  gap: 20,
  fontWeight: "bold"
};
