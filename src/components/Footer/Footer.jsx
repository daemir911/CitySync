import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">🏙️ CitySync</span>
          <p>Helping newcomers find where to actually live — powered by real data.</p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4>App</h4>
            <Link to="/">Home</Link>
            <Link to="/preferences">Get Started</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
          <div className="footer-col">
            <h4>Tools</h4>
            <Link to="/compare">Compare Areas</Link>
            <Link to="/saved">Saved</Link>
          </div>
          <div className="footer-col">
            <h4>Data Sources</h4>
            <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
            <a href="https://nominatim.org" target="_blank" rel="noopener noreferrer">Nominatim</a>
            <a href="https://project-osrm.org" target="_blank" rel="noopener noreferrer">OSRM Routing</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 CitySync · Built for the real-world housing problem · Data © OpenStreetMap contributors (ODbL)</p>
      </div>
    </footer>
  );
}

export default Footer;
