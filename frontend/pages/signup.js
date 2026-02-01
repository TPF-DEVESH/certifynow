const API = "https://certifynow-siyv.onrender.com";

export default function Signup() {
  const submit = async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      alert("Signup failed");
      return;
    }

    alert("Account created. Please login.");
    window.location.href = "/login";
  };

  return (
    <div style={{ padding: 60 }}>
      <h2>Create CertifyNow Account</h2>

      <input id="email" placeholder="Email" /><br /><br />
      <input id="password" type="password" placeholder="Password" /><br /><br />

      <button onClick={submit}>Sign Up</button>
    </div>
  );
}
