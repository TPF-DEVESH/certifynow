import { getToken } from "../utils/auth";

const API = "http://localhost:5000";

export default function Settings() {
  const save = async () => {
    const payload = {
      host: document.getElementById("host").value,
      port: Number(document.getElementById("port").value),
      user: document.getElementById("user").value,
      pass: document.getElementById("pass").value,
      secure: false
    };

    const res = await fetch(`${API}/api/settings/smtp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getToken()
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) alert("SMTP saved successfully");
    else alert("Upgrade to paid plan required");
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Custom Email (SMTP)</h2>

      <input id="host" placeholder="SMTP Host" /><br /><br />
      <input id="port" placeholder="Port" /><br /><br />
      <input id="user" placeholder="Email Address" /><br /><br />
      <input id="pass" type="password" placeholder="App Password" /><br /><br />

      <button onClick={save}>Save SMTP</button>
    </div>
  );
}
