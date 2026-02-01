import { useState } from "react";
import { getToken, logout } from "../utils/auth";

const API = "http://localhost:5000";

export default function Dashboard() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);

  const click = (e) => {
    const r = e.target.getBoundingClientRect();
    setPos({
      x: Math.round(e.clientX - r.left),
      y: Math.round(e.clientY - r.top)
    });
  };

  const submit = async () => {
    const form = document.getElementById("sendForm");
    const data = new FormData(form);

    data.append("x", pos.x);
    data.append("y", pos.y);

    setLoading(true);

    const res = await fetch(`${API}/api/certificate/send`, {
      method: "POST",
      headers: {
        Authorization: getToken()
      },
      body: data
    });

    setLoading(false);

    if (res.ok) alert("Certificates queued successfully");
    else alert("Error or daily limit reached");
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Send Certificates</h2>

      <button onClick={logout}>Logout</button>

      <p>Click on the certificate to place the name:</p>

      <img
        src="/sample-cert.png"
        onClick={click}
        style={{ width: 600, cursor: "crosshair", border: "1px solid #ccc" }}
      />

      <p>X: {pos.x} | Y: {pos.y}</p>

      <form id="sendForm" encType="multipart/form-data">
        <input type="file" name="template" required /><br /><br />
        <input type="file" name="csv" required /><br /><br />
        <textarea name="message" placeholder="Email message" required /><br /><br />

        <button type="button" onClick={submit} disabled={loading}>
          {loading ? "Sending..." : "Send Certificates"}
        </button>
      </form>
    </div>
  );
}
