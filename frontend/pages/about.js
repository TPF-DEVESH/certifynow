import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function About() {
  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "60px auto", padding: 20 }}>
        <h1>About CertifyNow</h1>
        <p>
          CertifyNow helps trainers, educators, and organizations automate
          certificate creation and delivery.
        </p>
        <p>
          No design tools. No manual editing. Just upload, click, and send.
        </p>
      </div>
      <Footer />
    </>
  );
}
