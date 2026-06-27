import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <span className="brand-icon">🏙️</span>
        CitySync
      </Link>

      {/* Desktop links */}
      <div className={`nav-links ${menuOpen ? "open" : ""}`}>
        <NavLink to="/" end onClick={() => setMenuOpen(false)}>Home</NavLink>
        <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
        <NavLink to="/compare" onClick={() => setMenuOpen(false)}>Compare</NavLink>
        <NavLink to="/saved" onClick={() => setMenuOpen(false)}>Saved</NavLink>
        <NavLink to="/preferences" className="nav-cta" onClick={() => setMenuOpen(false)}>
          Get Started
        </NavLink>
      </div>

      {/* Mobile hamburger */}
      <button
        className={`hamburger ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
      >
        <span /><span /><span />
      </button>
    </nav>
  );
}

export default Navbar;
