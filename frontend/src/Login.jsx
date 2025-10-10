import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const { data } = await axios.post("http://127.0.0.1:8000/auth/login", { email, password });
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("name", data.name || email);
      nav("/");
    } catch (err) {
      setMsg(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="app app-wide">
      <h1 className="app-title">Log in</h1>
      <div className="upload-card card" style={{ maxWidth: 460 }}>
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
          <button className="upload-btn" type="submit">Log in</button>
          {msg && <div className="error-message">{msg}</div>}
        </form>
        <p style={{ marginTop: 8 }}>
          New here? <a href="/signup">Create an account</a>
        </p>
      </div>
    </div>
  );
}
