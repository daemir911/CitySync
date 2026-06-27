import "./FindProperties.css";

const PLATFORMS = [
  {
    name: "MagicBricks",
    icon: "🏠",
    color: "#e84118",
    buildUrl: (area, city) =>
      `https://www.magicbricks.com/property-for-rent/residential-real-estate?proptype=Multistorey-Apartment,Builder-Floor-Apartment,Penthouse,Studio-Apartment&cityName=${encodeURIComponent(city)}&Area=${encodeURIComponent(area)}`,
  },
  {
    name: "NoBroker",
    icon: "🔑",
    color: "#0a84ff",
    buildUrl: (area, city) =>
      `https://www.nobroker.in/property/rent/${encodeURIComponent(city.toLowerCase())}/?searchParam=${encodeURIComponent(area)}`,
  },
  {
    name: "99acres",
    icon: "🏗️",
    color: "#ff6b35",
    buildUrl: (area, city) =>
      `https://www.99acres.com/search/property/rent/${encodeURIComponent(area.toLowerCase().replace(/\s+/g, "-") + "-" + city.toLowerCase().replace(/\s+/g, "-"))}?preference=S&area_unit=1&res_com=R`,
  },
];

/**
 * "Find Properties" section — links to real rental platforms
 * pre-filtered to the neighbourhood.
 *
 * Props: locationName (e.g. "Indiranagar"), city (e.g. "Bengaluru")
 */
function FindProperties({ locationName, city }) {
  // Extract just the neighbourhood part before the comma
  const area = locationName?.split(",")[0]?.trim() || locationName;
  const cityName = city || locationName?.split(",")[1]?.trim() || "";

  return (
    <div className="find-props">
      <div className="find-props-header">
        <span className="find-props-title">🏘️ Find Properties</span>
        <span className="find-props-sub">
          Search live listings in {area} on these platforms
        </span>
      </div>

      <div className="find-props-grid">
        {PLATFORMS.map((platform) => (
          <a
            key={platform.name}
            href={platform.buildUrl(area, cityName)}
            target="_blank"
            rel="noopener noreferrer"
            className="find-props-btn"
            style={{ "--platform-color": platform.color }}
          >
            <span className="fp-icon">{platform.icon}</span>
            <div className="fp-text">
              <span className="fp-name">{platform.name}</span>
              <span className="fp-area">{area}</span>
            </div>
            <span className="fp-arrow">↗</span>
          </a>
        ))}
      </div>

      <p className="find-props-disclaimer">
        Opens the respective platform in a new tab. CitySync is not affiliated with any listing service.
      </p>
    </div>
  );
}

export default FindProperties;
