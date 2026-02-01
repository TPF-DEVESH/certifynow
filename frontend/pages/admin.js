import { getToken } from "../utils/auth";

const API = "http://localhost:5000";

export default function Admin() {
  const loadUsers = async () => {
    const res = await fetch(`${API}/api/admin/users`, {
      headers: { Authorization: getToken() }
    });
    console.log(await res.json());
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>CertifyNow Admin</h1>
      <button onClick={loadUsers}>Load Users (console)</button>
    </div>
  );
}
