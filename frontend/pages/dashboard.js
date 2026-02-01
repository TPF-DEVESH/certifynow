import { useState } from "react";

export default function Dashboard() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const click = e => {
    const r = e.target.getBoundingClientRect();
    setPos({ x: Math.round(e.clientX - r.left), y: Math.round(e.clientY - r.top) });
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Send Certificates</h2>

      <img
        src="/sample-cert.png"
        onClick={click}
        style={{ width: 600, cursor: "crosshair" }}
      />

      <p>X: {pos.x}, Y: {pos.y}</p>

      <form method="POST" encType="multipart/form-data">
        <input type="hidden" name="x" value={pos.x} />
        <input type="hidden" name="y" value={pos.y} />
        <input type="file" name="template" /><br /><br />
        <input type="file" name="csv" /><br /><br />
        <textarea name="message" placeholder="Email message" /><br /><br />
        <button>Send</button>
      </form>
    </div>
  );
}
