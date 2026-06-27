import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "./LocationCard.css";

function ScoreBar({ label, value }) {
  const color = value >= 8 ? "#22c55e" : value >= 6 ? "#f59e0b" : "#ef4444";
  return (
    <div className="score-bar-row">
      <span className="score-bar-label">{label}</span>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${value * 10}%`, background: color }}
        />
      </div>
      <span className="score-bar-value">{value}</span>
    </div>
  );
}

function LocationCard({ location, matchScore }) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedLocations") || "[]");
    setIsSaved(saved.includes(location.id));
  }, [location.id]);

  const toggleSave = () => {
    const saved = JSON.parse(localStorage.getItem("savedLocations") || "[]");
    const updated = saved.includes(location.id)
      ? saved.filter((id) => id !== location.id)
      : [...saved, location.id];
    localStorage.setItem("savedLocations", JSON.stringify(updated));
    const nowSaved = updated.includes(location.id);
    setIsSaved(nowSaved);
    toast(nowSaved ? `Saved ${location.name}` : `Removed ${location.name}`, {
      position: "bottom-right",
      autoClose: 2000,
      theme: "dark",
    });
  };

  // Handle numeric or "—" matchScore gracefully
  const numericScore = typeof matchScore === "number" ? matchScore : null;
  const matchColor = numericScore === null
    ? "#334155"
    : numericScore >= 80 ? "#22c55e"
    : numericScore >= 60 ? "#f59e0b"
    : "#ef4444";

  return (
    <div className="location-card">
      <div className="card-top">
        <div className="card-title-block">
          <h2 className="card-name">{location.name}</h2>
          <p className="card-description">{location.description}</p>
        </div>
        <div
          className="match-badge"
          style={{ background: matchColor }}
          title="Match score based on your preferences"
        >
          {numericScore !== null ? `${numericScore}%` : "—"}
          <span className="match-label">Match</span>
        </div>
      </div>

      <div className="card-stats">
        <div className="stat-chip">
          <span className="stat-icon">💰</span>
          <span>₹{location.rent.toLocaleString()}/mo</span>
        </div>
        <div className="stat-chip">
          <span className="stat-icon">🚇</span>
          <span>{location.commute} min commute{location.isLive ? <span className="live-tag">live</span> : null}</span>
        </div>
        <div className="stat-chip">
          <span className="stat-icon">🛡️</span>
          <span>Safety {location.safety}/10</span>
        </div>
        <div className="stat-chip">
          <span className="stat-icon">🚌</span>
          <span>Transit {location.transit}/10</span>
        </div>
      </div>

      <div className="score-bars">
        <ScoreBar label="Amenities" value={location.amenities} />
        <ScoreBar label="Safety" value={location.safety} />
        <ScoreBar label="Transit" value={location.transit} />
      </div>

      {location.highlights && (
        <div className="card-highlights">
          {location.highlights.slice(0, 3).map((h) => (
            <span key={h} className="highlight-tag">
              {h}
            </span>
          ))}
        </div>
      )}

      <div className="card-actions">
        <Link to={`/details/${location.id}`} className="btn-outline">
          View Details
        </Link>
        <button
          onClick={toggleSave}
          className={isSaved ? "btn-saved" : "btn-save"}
        >
          {isSaved ? "✓ Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}

export default LocationCard;
