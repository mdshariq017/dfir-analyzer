import { Link } from "react-router-dom";

export default function HeroHeader() {
  return (
    <header className="hero-header" role="banner" aria-label="Top hero navigation">
      <div className="header-inner container">
        <Link to="/" className="brand-link" aria-label="DFIR Analyzer home">
          <span className="brand-logo">DFIR Analyzer</span>
        </Link>

        <nav className="hero-nav" aria-label="Primary">
          <Link to="/features" className="nav-link">Features</Link>
          <Link to="/docs" className="nav-link">Docs</Link>
          <Link to="/dashboard" className="nav-link nav-cta">Dashboard</Link>
        </nav>
      </div>
    </header>
  );
}

