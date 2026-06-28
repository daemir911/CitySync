import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapModal.css";

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function scoreIcon(score) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52">
      <ellipse cx="22" cy="47" rx="7" ry="3.5" fill="rgba(0,0,0,0.3)"/>
      <circle cx="22" cy="22" r="20" fill="${color}" stroke="white" stroke-width="3"/>
      <text x="22" y="27" text-anchor="middle" fill="white"
            font-family="Poppins,sans-serif" font-size="12" font-weight="700">${score}%</text>
    </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [44, 52], iconAnchor: [22, 52], popupAnchor: [0, -54] });
}

/** Auto-centre and zoom to the location */
function FlyTo({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 14, { duration: 0.8 });
  }, [lat, lon, map]);
  return null;
}

/**
 * MapModal — fullscreen overlay focused on a single location.
 * Props: location (with lat/lon), matchScore, onClose
 */
function MapModal({ location, matchScore, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!location.lat || !location.lon) {
    return (
      <div className="map-modal-overlay" onClick={onClose}>
        <div className="map-modal" onClick={(e) => e.stopPropagation()}>
          <button className="map-modal-close" onClick={onClose}>✕</button>
          <div className="map-modal-no-coords">
            <p>📍 Location coordinates not available yet.</p>
            <p>Try again after live data finishes loading.</p>
          </div>
        </div>
      </div>
    );
  }

  const score = typeof matchScore === "number" ? matchScore : null;

  return (
    <div className="map-modal-overlay" onClick={onClose}>
      <div className="map-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="map-modal-header">
          <div>
            <h2 className="map-modal-title">{location.name}</h2>
            <p className="map-modal-sub">
              {location.rent > 0 && `₹${location.rent.toLocaleString()}/mo · `}
              {location.commute > 0 && `${location.commute} min commute · `}
              Safety {location.safety}/10
            </p>
          </div>
          <div className="map-modal-right">
            {score !== null && (
              <div
                className="map-modal-score"
                style={{ background: score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444" }}
              >
                {score}%
              </div>
            )}
            <button className="map-modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Map */}
        <div className="map-modal-map">
          <MapContainer
            key={`modal-${location.id}-${location.lat}-${location.lon}`}
            center={[location.lat, location.lon]}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <FlyTo lat={location.lat} lon={location.lon} />

            {/* 1.5km radius circle — amenity search radius */}
            <Circle
              center={[location.lat, location.lon]}
              radius={1500}
              pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.06, weight: 1.5, dashArray: "6 4" }}
            />

            {/* Main pin */}
            <Marker
              position={[location.lat, location.lon]}
              icon={scoreIcon(score ?? 70)}
            >
              <Popup>
                <div style={{ fontFamily: "Poppins,sans-serif", fontSize: "0.83rem", minWidth: 150 }}>
                  <strong>{location.name}</strong>
                  {location.rent > 0 && <p>₹{location.rent.toLocaleString()}/mo</p>}
                  {location.commute > 0 && <p>{location.commute} min commute</p>}
                  <p>Safety {location.safety}/10</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Footer chips */}
        <div className="map-modal-footer">
          <span className="map-chip">🛡️ Safety {location.safety}/10</span>
          <span className="map-chip">🚌 Transit {location.transit}/10</span>
          <span className="map-chip">🏥 Amenities {location.amenities}/10</span>
          <span className="map-chip map-chip-hint">Dashed circle = 1.5 km amenity radius</span>
        </div>
      </div>
    </div>
  );
}

export default MapModal;
