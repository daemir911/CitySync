import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapModal.css";

// Fix Leaflet default icon broken by Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function makeIcon(score) {
  const color =
    score >= 80 ? "#10b981" :
    score >= 60 ? "#f59e0b" : "#ef4444";
  const label = score != null ? `${score}%` : "📍";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="50" viewBox="0 0 42 50">
    <ellipse cx="21" cy="46" rx="7" ry="3" fill="rgba(0,0,0,0.3)"/>
    <circle cx="21" cy="21" r="19" fill="${color}" stroke="white" stroke-width="2.5"/>
    <text x="21" y="26" text-anchor="middle" fill="white"
          font-family="system-ui,sans-serif" font-size="11" font-weight="700">${label}</text>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [42, 50],
    iconAnchor: [21, 50],
    popupAnchor: [0, -52],
  });
}

function MapModal({ location, matchScore, onClose }) {
  const score = typeof matchScore === "number" ? matchScore : null;

  // Close on Escape
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  // No coords yet
  if (!location?.lat || !location?.lon) {
    return (
      <div className="mm-overlay" onClick={onClose}>
        <div className="mm-box" onClick={(e) => e.stopPropagation()}>
          <div className="mm-header">
            <span className="mm-title">{location?.name}</span>
            <button className="mm-close" onClick={onClose}>✕</button>
          </div>
          <div className="mm-nocoords">
            <p>📍 Coordinates not available yet.</p>
            <p>Wait for live data to finish loading, then try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm-box" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="mm-header">
          <div className="mm-header-left">
            <span className="mm-title">{location.name}</span>
            <span className="mm-sub">
              {location.rent > 0 && `₹${location.rent.toLocaleString()}/mo · `}
              {location.commute > 0 && `${location.commute} min · `}
              Safety {location.safety}/10
            </span>
          </div>
          <div className="mm-header-right">
            {score !== null && (
              <span className="mm-score" style={{
                background: score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444"
              }}>
                {score}%
              </span>
            )}
            <button className="mm-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Map — explicit pixel height so Leaflet initialises correctly */}
        <div style={{ height: 400, width: "100%", position: "relative" }}>
          <MapContainer
            key={`${location.id}-${location.lat}`}
            center={[location.lat, location.lon]}
            zoom={14}
            style={{ height: "100%", width: "100%", zIndex: 1 }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <Circle
              center={[location.lat, location.lon]}
              radius={1500}
              pathOptions={{
                color: "#0d9488",
                fillColor: "#0d9488",
                fillOpacity: 0.07,
                weight: 1.5,
                dashArray: "6 4",
              }}
            />
            <Marker
              position={[location.lat, location.lon]}
              icon={makeIcon(score)}
            >
              <Popup>
                <b>{location.name}</b>
                {location.rent > 0 && <div>₹{location.rent.toLocaleString()}/mo</div>}
                {location.commute > 0 && <div>{location.commute} min commute</div>}
                <div>Safety {location.safety}/10</div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Footer */}
        <div className="mm-footer">
          <span className="mm-chip">🛡️ Safety {location.safety}/10</span>
          <span className="mm-chip">🚌 Transit {location.transit}/10</span>
          <span className="mm-chip">🏥 Amenities {location.amenities}/10</span>
          <span className="mm-chip mm-hint">Dashed circle = 1.5 km radius</span>
        </div>
      </div>
    </div>
  );
}

export default MapModal;
