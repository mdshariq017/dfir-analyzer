// src/Header.jsx
import { Link } from "react-router-dom";

export default function Header({
  name,
  token,
  menuOpen,
  setMenuOpen,
  avatarRef,
  logout,
}) {
  return (
    <header className="glass-header">
      <div className="header-content">
        <h1 className="app-title">DFIR Analyzer</h1>
        <div className="topbar-right">
          <span className="welcome-text">Welcome, {name}</span>
          <div className="avatar-wrap" ref={avatarRef} tabIndex={0}>
            <button
              className="avatar-btn"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {token ? (
                (name?.[0] || "U").toString().toUpperCase()
              ) : (
                <img src="/login.png" alt="Login" className="login-icon" />
              )}
            </button>
            {menuOpen && (
              <div className="avatar-menu">
                {!token ? (
                  <>
                    <Link
                      to="/signup"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setMenuOpen(false)}
                    >
                      Sign up
                    </Link>
                    <Link
                      to="/login"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setMenuOpen(false)}
                    >
                      Log in
                    </Link>
                  </>
                ) : (
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                  >
                    Logout
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
