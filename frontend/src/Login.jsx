import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import LetterGlitch from "./LetterGlitch"; // import glitch background

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const { data } = await axios.post("http://127.0.0.1:8000/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("name", data.name || email);
      nav("/dashboard");
    } catch (err) {
      setMsg(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="auth-page" style={{ position: "relative" }}>
      {/* Glitch background */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -1,
          pointerEvents: "none",
        }}
      >
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={false}
          smooth={true}
        />
      </div>

      {/* Login form panel */}
      <div className="auth-panel">
        <h1>Log in</h1>
        <div className="auth-card">
          <form onSubmit={submit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Log in</button>
            {msg && <div className="error-message">{msg}</div>}
          </form>
          <p className="auth-subtext">
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
