import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Signup() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const { data } = await axios.post("http://127.0.0.1:8000/auth/register", { 
        email, 
        password, 
        name 
      });
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("name", data.name || email);
      nav("/");
    } catch (err) {
      setMsg(err.response?.data?.detail || "Signup failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <h1>Sign up</h1>
        <div className="auth-card">
          <form onSubmit={submit}>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="submit">Sign up</button>
            {msg && <div className="error-message">{msg}</div>}
          </form>
          <p className="auth-subtext">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
