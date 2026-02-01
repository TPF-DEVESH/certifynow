export default function Signup() {
  const submit = async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    window.location.href = "/login";
  };

  return (
    <div style={{ padding: 60 }}>
      <h2>Create Account</h2>
      <input id="email" placeholder="Email" /><br /><br />
      <input id="password" type="password" /><br /><br />
      <button onClick={submit}>Sign Up</button>
    </div>
  );
}
