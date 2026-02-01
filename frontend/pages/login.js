import { setToken } from "../utils/auth";

export default function Login() {
  const submit = async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) return alert("Invalid login");

    const data = await res.json();
    setToken(data.token);
    window.location.href = "/dashboard";
  };

  return (
    <div style={{ padding: 60 }}>
      <h2>Login</h2>
      <input id="email" placeholder="Email" /><br /><br />
      <input id="password" type="password" placeholder="Password" /><br /><br />
      <button onClick={submit}>Login</button>
    </div>
  );
}
