import { getToken } from "../utils/auth";

const API = "http://localhost:5000";

export default function Pricing() {
  const buy = async (plan) => {
    const res = await fetch(`${API}/api/payment/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getToken()
      },
      body: JSON.stringify({ plan })
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  return (
    <div style={{ padding: 60 }}>
      <h1>CertifyNow Pricing</h1>

      <div style={{ display: "flex", gap: 20 }}>
        <Plan title="Free" price="$0" features={["100/day", "Platform email"]} />

        <Plan
          title="Pro – 15 Days"
          price="$5"
          features={["1000 emails", "Custom SMTP"]}
          action={() => buy("15")}
        />

        <Plan
          title="Pro – Monthly"
          price="$8"
          features={["1000 emails", "Custom SMTP"]}
          action={() => buy("30")}
        />
      </div>
    </div>
  );
}

function Plan({ title, price, features, action }) {
  return (
    <div style={{ background: "#fff", padding: 30, borderRadius: 10 }}>
      <h2>{title}</h2>
      <h3>{price}</h3>
      <ul>{features.map(f => <li key={f}>{f}</li>)}</ul>
      {action && <button onClick={action}>Buy Now</button>}
    </div>
  );
}
