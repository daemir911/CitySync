import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import MapModal from "../../components/MapModal/MapModal";
import FindProperties from "../../components/FindProperties/FindProperties";
import { useLocations } from "../../context/LocationsContext";
import "./AreaDetails.css";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

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
  const [showMap, setShowMap] = useState(false);

  const location = locations.find(
    (item) => String(item.id) === String(id)
  );

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

  const radarData = {
    labels: ["Safety", "Transit", "Amenities", "Schools", "Parks", "Nightlife"],
    datasets: [
      {
        label: location.name.split(",")[0],
        data: [
          location.safety,
          location.transit,
          location.amenities,
          location.schools,
          location.parks,
          location.nightlife,
        ],
        backgroundColor: "rgba(37, 99, 235, 0.15)",
        borderColor: "#2563eb",
        borderWidth: 2,
        pointBackgroundColor: "#2563eb",
        pointRadius: 4,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: {
          stepSize: 2,
          color: "#475569",
          font: { size: 10 },
          backdropColor: "transparent",
        },
        grid: { color: "#334155" },
        angleLines: { color: "#334155" },
        pointLabels: { color: "#94a3b8", font: { size: 12 } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.raw}/10`,
        },
      },
    },
  };

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
          <div className="details-header-right">
            {location.rent > 0 && (
              <div className="details-rent">
                <span className="rent-amount">₹{location.rent.toLocaleString()}</span>
                <span className="rent-label">/ month avg.</span>
              </div>
            )}
            <button
              className="details-map-btn"
              onClick={() => setShowMap(true)}
              title={location.lat ? "View on map" : "Coordinates not available"}
            >
              🗺 View on Map
            </button>
          </div>
        </div>

        <p className="details-description">{location.description}</p>

        {/* Radar chart + scores side by side */}
        <div className="details-grid">
          <div className="details-card radar-card">
            <h3>Area Profile</h3>
            <div className="radar-wrap">
              <Radar data={radarData} options={radarOptions} />
            </div>
          </div>

          <div className="details-card">
            <h3>Scores</h3>
            <MetricRow label="Safety"    value={location.safety} />
            <MetricRow label="Transit"   value={location.transit} />
            <MetricRow label="Amenities" value={location.amenities} />
            <MetricRow label="Schools"   value={location.schools} />
            <MetricRow label="Parks"     value={location.parks} />
            <MetricRow label="Nightlife" value={location.nightlife} />
          </div>
        </div>

        {/* Lifestyle + commute */}
        <div className="details-grid" style={{ marginTop: "24px" }}>
          <div className="details-card">
            <h3>Lifestyle Fit</h3>
            <MetricRow label="Family"  value={location.familyFriendly} />
            <MetricRow label="Couple"  value={location.coupleFriendly} />
            <MetricRow label="Student" value={location.studentFriendly} />
          </div>

          <div className="details-card">
            <h3>Commute</h3>
            <div className="commute-chip">
              🚇 {location.commute > 0 ? `~${location.commute} min` : "Calculating…"} average commute
              {location.isLive && location.commute > 0 && (
                <span className="live-inline">live</span>
              )}
            </div>

            {(location.transportOptions || []).length > 0 && (
              <>
                <h3 style={{ marginTop: "24px" }}>Transport</h3>
                <div className="tag-row">
                  {location.transportOptions.map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Highlights */}
        {(location.highlights || []).length > 0 && (
          <div className="details-card" style={{ marginTop: "24px" }}>
            <h3>Highlights</h3>
            <ul className="highlights-list">
              {location.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Nearby Landmarks */}
        {(location.nearbyLandmarks || []).length > 0 && (
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
            <h3>
              Live Amenity Counts{" "}
              <span style={{ color: "#22c55e", textTransform: "none", letterSpacing: 0 }}>
                · OpenStreetMap
              </span>
            </h3>
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

        {/* Find Properties */}
        <div style={{ marginTop: "24px" }}>
          <FindProperties locationName={location.name} city={location.city} />
        </div>
      </div>

      {showMap && (
        <MapModal
          location={location}
          matchScore={null}
          onClose={() => setShowMap(false)}
        />
      )}

      <Footer />
    </>
  );
}

export default AreaDetails;
