export default function Footer() {
  return (
    <footer style={footer}>
      © {new Date().getFullYear()} CertifyNow · Certificate Automation Platform
    </footer>
  );
}

const footer = {
  marginTop: 80,
  padding: 20,
  textAlign: "center",
  background: "#fff",
  color: "#555"
};
