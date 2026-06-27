import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./NeighbourhoodMap.css";

// Fix default icon paths broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/**
 * Creates a colour-coded circle icon based on match score.
 */
function scoreIcon(score) {
  const color =
    score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42">
      <ellipse cx="18" cy="38" rx="6" ry="3" fill="rgba(0,0,0,0.25)"/>
      <circle cx="18" cy="18" r="17" fill="${color}" stroke="white" stroke-width="2.5"/>
      <text x="18" y="23" text-anchor="middle" fill="white"
            font-family="Poppins,sans-serif" font-size="11" font-weight="700">${score}%</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -44],
  });
}

/**
 * Workplace marker (blue pin).
 */
function workplaceIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="36" viewBox="0 0 30 36">
      <ellipse cx="15" cy="33" rx="5" ry="2.5" fill="rgba(0,0,0,0.25)"/>
      <circle cx="15" cy="15" r="14" fill="#2563eb" stroke="white" stroke-width="2"/>
      <text x="15" y="20" text-anchor="middle" fill="white"
            font-family="sans-serif" font-size="14">🏢</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [30, 36],
    iconAnchor: [15, 36],
    popupAnchor: [0, -38],
  });
}

/** Auto-fit map bounds to show all markers */
function AutoBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (!positions.length) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [positions, map]);
  return null;
}

/**
 * @param {Array} locations - enriched locations with lat/lon and matchScore
 * @param {{ lat, lon, name }} workplaceCoords - optional workplace pin
 */
function NeighbourhoodMap({ locations, workplaceCoords }) {
  const validLocations = locations.filter((l) => l.lat && l.lon);

  const allPositions = [
    ...validLocations.map((l) => [l.lat, l.lon]),
    ...(workplaceCoords ? [[workplaceCoords.lat, workplaceCoords.lon]] : []),
  ];

  // Default center: India
  const defaultCenter = [20.5937, 78.9629];

  return (
    <div className="map-wrapper">
      <MapContainer
        center={defaultCenter}
        zoom={5}
        className="leaflet-map"
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {allPositions.length > 1 && <AutoBounds positions={allPositions} />}

        {/* Workplace pin */}
        {workplaceCoords && (
          <Marker
            position={[workplaceCoords.lat, workplaceCoords.lon]}
            icon={workplaceIcon()}
          >
            <Popup>
              <div className="map-popup">
                <strong>📍 Workplace</strong>
                <p>{workplaceCoords.name}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Neighbourhood pins */}
        {validLocations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lon]}
            icon={scoreIcon(loc.matchScore ?? 50)}
          >
            <Popup>
              <div className="map-popup">
                <strong>{loc.name}</strong>
                <p>₹{loc.rent?.toLocaleString()}/mo · {loc.commute} min commute</p>
                <p>Safety {loc.safety}/10 · Amenities {loc.amenities}/10</p>
                <Link to={`/details/${loc.id}`}>View details →</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#22c55e" }} />
          ≥ 80% match
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#f59e0b" }} />
          60–79%
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#ef4444" }} />
          &lt; 60%
        </div>
      </div>
    </div>
  );
}

export default NeighbourhoodMap;
