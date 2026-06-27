import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import LocationCard from "../../components/LocationCard/LocationCard";
import { locations } from "../../data/locations";
import "./Saved.css";

function Saved() {
  const [savedLocations, setSavedLocations] = useState([]);

  const loadSaved = () => {
    const stored = JSON.parse(localStorage.getItem("savedLocations") || "[]");
    setSavedLocations(locations.filter((l) => stored.includes(l.id)));
  };

  useEffect(() => {
    loadSaved();

    // Refresh when localStorage changes (e.g. unsaved from card)
    const handleStorage = () => loadSaved();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const clearAll = () => {
    localStorage.removeItem("savedLocations");
    setSavedLocations([]);
  };

  return (
    <>
      <Navbar />

      <div className="saved-page">
        <div className="saved-header">
          <div>
            <h1>Saved Neighbourhoods</h1>
            <p>Your shortlist for the move. Compare or dig into details from here.</p>
          </div>
          {savedLocations.length > 0 && (
            <button className="clear-btn" onClick={clearAll}>
              Clear all
            </button>
          )}
        </div>

        {savedLocations.length === 0 ? (
          <div className="saved-empty">
            <div className="empty-icon">🏘️</div>
            <h2>No saved areas yet</h2>
            <p>Browse the dashboard and save the areas that look promising.</p>
            <Link to="/dashboard" className="cta-btn">Go to Dashboard</Link>
          </div>
        ) : (
          <>
            <p className="saved-count">{savedLocations.length} area{savedLocations.length > 1 ? "s" : ""} saved</p>
            {savedLocations.map((l) => (
              <LocationCard key={l.id} location={l} matchScore="—" />
            ))}
            {savedLocations.length >= 2 && (
              <div className="compare-prompt">
                <p>Want to compare two of these?</p>
                <Link to="/compare" className="cta-btn">Open Compare →</Link>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </>
  );
}

export default Saved;
