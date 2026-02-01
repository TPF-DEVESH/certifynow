export default function Settings() {
  return (
    <div style={{ padding: 40 }}>
      <h2>SMTP Settings (Paid)</h2>

      <input placeholder="SMTP Host" /><br /><br />
      <input placeholder="Port" /><br /><br />
      <input placeholder="Email" /><br /><br />
      <input placeholder="App Password" type="password" /><br /><br />

      <button>Save SMTP</button>
    </div>
  );
}
