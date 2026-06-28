import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import MapModal from "../MapModal/MapModal";
import FindProperties from "../FindProperties/FindProperties";
import "./LocationCard.css";

function ScoreBar({ label, value }) {
  const color = value >= 8 ? "var(--green)" : value >= 6 ? "var(--amber)" : "var(--red)";
  return (
    <div className="score-bar-row">
      <span className="score-bar-label">{label}</span>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${value * 10}%`, background: color }} />
      </div>
      <span className="score-bar-value">{value}</span>
    </div>
  );
}

function buildScoreReason(location, matchScore) {
  if (!matchScore || matchScore === "—") return null;
  const reasons = [];
  if (location.rent > 0 && location.commute > 0) {
    const budgetNote = location.rent <= 20000 ? "budget-friendly rent" : "rent within range";
    const commuteNote = location.commute <= 30 ? "short commute" : `${location.commute}-min commute`;
    reasons.push(`${budgetNote}, ${commuteNote}`);
  }
  if (location.safety >= 9) reasons.push("excellent safety");
  else if (location.safety >= 8) reasons.push("good safety");
  if (location.amenities >= 9) reasons.push("top-tier amenities");
  if (location.transit >= 8.5) reasons.push("great transit");
  return reasons.length ? reasons.slice(0, 2).join(" · ") : null;
}

function LocationCard({ location, matchScore }) {
  const [isSaved, setIsSaved] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showProperties, setShowProperties] = useState(false);

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

  const numericScore = typeof matchScore === "number" ? matchScore : null;
  const matchColor = numericScore === null
    ? "#334155"
    : numericScore >= 80 ? "#22c55e"
    : numericScore >= 60 ? "#f59e0b"
    : "#ef4444";

  const scoreReason = buildScoreReason(location, matchScore);

  const scoreClass = numericScore === null ? "" : numericScore >= 80 ? "score-high" : numericScore >= 60 ? "score-mid" : "score-low";

  return (
    <div className={`location-card ${scoreClass}`}>
      <div className="card-top">
        <div className="card-title-block">
          <h2 className="card-name">{location.name}</h2>
          <p className="card-description">{location.description}</p>
        </div>
        <div className="badge-wrap">
          <div
            className="match-badge"
            style={{ background: matchColor }}
            title="Match score based on your preferences"
          >
            {numericScore !== null ? `${numericScore}%` : "—"}
            <span className="match-label">Match</span>
          </div>
          {numericScore !== null && (
            <button className="why-btn" onClick={() => setShowWhy((v) => !v)}>
              {showWhy ? "▲" : "Why?"}
            </button>
          )}
        </div>
      </div>

      {showWhy && numericScore !== null && (
        <div className="why-panel">
          <p className="why-title">Score breakdown</p>
          <div className="why-rows">
            <div className="why-row">
              <span>Budget fit</span>
              <span className="why-val">{location.rent > 0 ? `₹${location.rent.toLocaleString()}` : "—"}</span>
            </div>
            <div className="why-row">
              <span>Commute</span>
              <span className="why-val">{location.commute > 0 ? `${location.commute} min` : "—"}</span>
            </div>
            <div className="why-row">
              <span>Safety</span>
              <span className="why-val">{location.safety}/10</span>
            </div>
            <div className="why-row">
              <span>Transit</span>
              <span className="why-val">{location.transit}/10</span>
            </div>
            <div className="why-row">
              <span>Amenities</span>
              <span className="why-val">{location.amenities}/10</span>
            </div>
          </div>
          {scoreReason && <p className="why-summary">✦ {scoreReason}</p>}
        </div>
      )}

      <div className="card-stats">
        <div className="stat-chip">
          <span className="stat-icon">💰</span>
          <span>{location.rent > 0 ? `₹${location.rent.toLocaleString()}/mo` : "Fetching…"}</span>
        </div>
        <div className="stat-chip">
          <span className="stat-icon">🚇</span>
          <span>
            {location.commute > 0 ? `${location.commute} min commute` : "Calculating…"}
            {location.isLive && location.commute > 0 && <span className="live-tag">live</span>}
          </span>
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
        <ScoreBar label="Safety"    value={location.safety} />
        <ScoreBar label="Transit"   value={location.transit} />
      </div>

      {(location.highlights || []).length > 0 && (
        <div className="card-highlights">
          {location.highlights.slice(0, 3).map((h) => (
            <span key={h} className="highlight-tag">{h}</span>
          ))}
        </div>
      )}

      <div className="card-actions">
        <Link to={`/details/${location.id}`} className="btn-outline">View Details</Link>
        <button
          onClick={() => setShowMap(true)}
          className="btn-map"
          title={location.lat ? "View on map" : "Coordinates loading…"}
        >
          🗺 Map
        </button>
        <button
          onClick={() => setShowProperties((v) => !v)}
          className={showProperties ? "btn-saved" : "btn-save"}
        >
          🏘️ Properties
        </button>
        <button onClick={toggleSave} className={isSaved ? "btn-saved" : "btn-save"}>
          {isSaved ? "✓ Saved" : "Save"}
        </button>
      </div>

      {showProperties && (
        <FindProperties locationName={location.name} city={location.city} />
      )}

      {showMap && (
        <MapModal
          location={location}
          matchScore={numericScore}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  );
}

export default LocationCard;
