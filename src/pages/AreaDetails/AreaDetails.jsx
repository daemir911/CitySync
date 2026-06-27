import { useParams, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useLocations } from "../../context/LocationsContext";
import "./AreaDetails.css";

function MetricRow({ label, value, max = 10 }) {
  const pct = (value / max) * 100;
  const color = value >= 8 ? "#22c55e" : value >= 6 ? "#f59e0b" : "#ef4444";
  return (
    <div className="metric-row">
      <span className="metric-label">{label}</span>
      <div className="metric-track">
        <div className="metric-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="metric-value" style={{ color }}>{value}/10</span>
    </div>
  );
}

function AreaDetails() {
  const { id } = useParams();
  const { locations } = useLocations();
  const location = locations.find((item) => item.id === Number(id));

  if (!location) {
    return (
      <>
        <Navbar />
        <div className="details-not-found">
          <h1>Area not found</h1>
          <p>Try going back to the dashboard and choosing another neighbourhood.</p>
          <Link to="/dashboard" className="back-link">← Back to dashboard</Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="details-page">
        <Link to="/dashboard" className="back-link">← Back to dashboard</Link>

        <div className="details-header">
          <div>
            <h1 className="details-title">{location.name}</h1>
            <p className="details-city">📍 {location.city}</p>
          </div>
          <div className="details-rent">
            <span className="rent-amount">₹{location.rent.toLocaleString()}</span>
            <span className="rent-label">/ month avg.</span>
          </div>
        </div>

        <p className="details-description">{location.description}</p>

        <div className="details-grid">
          {/* Scores */}
          <div className="details-card">
            <h3>Scores</h3>
            <MetricRow label="Safety" value={location.safety} />
            <MetricRow label="Transit" value={location.transit} />
            <MetricRow label="Amenities" value={location.amenities} />
            <MetricRow label="Schools" value={location.schools} />
            <MetricRow label="Parks" value={location.parks} />
            <MetricRow label="Nightlife" value={location.nightlife} />
          </div>

          {/* Lifestyle fit */}
          <div className="details-card">
            <h3>Lifestyle Fit</h3>
            <MetricRow label="Family" value={location.familyFriendly} />
            <MetricRow label="Couple" value={location.coupleFriendly} />
            <MetricRow label="Student" value={location.studentFriendly} />

            <h3 style={{ marginTop: "24px" }}>Commute</h3>
            <div className="commute-chip">
              🚇 ~{location.commute} min average commute
            </div>

            <h3 style={{ marginTop: "24px" }}>Transport</h3>
            <div className="tag-row">
              {(location.transportOptions || []).map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="details-card" style={{ marginTop: "24px" }}>
          <h3>Highlights</h3>
          <ul className="highlights-list">
            {(location.highlights || []).map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>

        {/* Nearby Landmarks */}
        {location.nearbyLandmarks && (
          <div className="details-card" style={{ marginTop: "24px" }}>
            <h3>Nearby Landmarks</h3>
            <div className="tag-row">
              {location.nearbyLandmarks.map((l) => (
                <span key={l} className="tag">{l}</span>
              ))}
            </div>
          </div>
        )}

        {/* Live OSM amenity counts */}
        {location.liveData && (
          <div className="details-card" style={{ marginTop: "24px" }}>
            <h3>Live Amenity Counts <span style={{ color: "#22c55e", textTransform: "none", letterSpacing: 0 }}>· OpenStreetMap data</span></h3>
            <div className="amenity-grid">
              <div className="amenity-chip">🏥 {location.liveData.healthcare} Healthcare</div>
              <div className="amenity-chip">🎓 {location.liveData.education} Education</div>
              <div className="amenity-chip">🛒 {location.liveData.grocery} Grocery</div>
              <div className="amenity-chip">🍽️ {location.liveData.food} Food & Cafes</div>
              <div className="amenity-chip">🌳 {location.liveData.leisure} Leisure</div>
              <div className="amenity-chip">🚌 {location.liveData.transport} Transit stops</div>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#475569", marginTop: "12px" }}>
              Counted within 1.5 km radius · Data © OpenStreetMap contributors
            </p>
          </div>
        )}

        <div style={{ marginTop: "32px" }}>
          <Link to="/compare" className="cta-link">Compare with another area →</Link>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default AreaDetails;
