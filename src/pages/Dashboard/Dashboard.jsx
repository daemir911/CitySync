import { useMemo, useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import LocationCard from "../../components/LocationCard/LocationCard";
import NeighbourhoodMap from "../../components/Map/NeighbourhoodMap";
import LiveDataBanner from "../../components/LiveDataBanner/LiveDataBanner";
import SkeletonCard from "../../components/SkeletonCard/SkeletonCard";
import { calculateMatchScore } from "../../utils/recommendations";
import { useEnrichedLocations } from "../../hooks/useEnrichedLocations";
import { useLocations } from "../../context/LocationsContext";
import "./Dashboard.css";

function Dashboard() {
  const routerLocation = useLocation();
  const preferences = routerLocation.state?.preferences || {
    budget: 18000,
    maxCommute: 30,
    household: "Student",
    transport: "Metro",
    workplace: "",
  };

  const [budgetFilter, setBudgetFilter] = useState(String(preferences.budget || 18000));
  const [commuteFilter, setCommuteFilter] = useState(String(preferences.maxCommute || 30));
  const [householdFilter, setHouseholdFilter] = useState(preferences.household || "Student");
  const [viewMode, setViewMode] = useState("list"); // "list" | "map"

  // Fetch live data (geocoding + commute + amenities)
  const { locations, loading, progress, error } = useEnrichedLocations(preferences);
  const { setLocations: setGlobalLocations } = useLocations();

  // Push enriched locations into context so other pages can read them
  useEffect(() => {
    if (!loading && locations.length) {
      setGlobalLocations(locations);
    }
  }, [loading, locations, setGlobalLocations]);

  // Score and filter
  const scoredLocations = useMemo(() => {
    const parsedBudget = Number(budgetFilter || 20000);
    const parsedCommute = Number(commuteFilter || 45);

    return locations
      .map((loc) => ({
        ...loc,
        matchScore: calculateMatchScore(loc, {
          ...preferences,
          budget: parsedBudget,
          maxCommute: parsedCommute,
          household: householdFilter,
        }),
      }))
      .filter((loc) => loc.rent <= parsedBudget && loc.commute <= parsedCommute)
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [locations, budgetFilter, commuteFilter, householdFilter, preferences]);

  // Workplace coords for map pin
  const workplaceCoords = useMemo(() => {
    const loc = locations.find((l) => l.lat);
    if (!loc || !preferences.workplace) return null;
    // We get workplace coords from the first enriched location's geocode context
    // The hook stores workplace coords in sessionStorage via geocode()
    const key = `nominatim:${preferences.workplace.toLowerCase().trim()}`;
    const cached = sessionStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { lat: parsed.lat, lon: parsed.lon, name: preferences.workplace };
    }
    return null;
  }, [locations, preferences.workplace]);

  return (
    <>
      <Navbar />

      <div className="dashboard">
        {/* Sidebar filters */}
        <div className="filters">
          <h2>Filters</h2>
          <p className="filter-copy">Adjust and see rankings update live.</p>

          <label>
            Budget (₹)
            <input
              type="number"
              value={budgetFilter}
              onChange={(e) => setBudgetFilter(e.target.value)}
            />
          </label>

          <label>
            Max Commute (min)
            <input
              type="number"
              value={commuteFilter}
              onChange={(e) => setCommuteFilter(e.target.value)}
            />
          </label>

          <label>
            Household
            <select
              value={householdFilter}
              onChange={(e) => setHouseholdFilter(e.target.value)}
            >
              <option value="Student">Student</option>
              <option value="Family">Family</option>
              <option value="Couple">Couple</option>
            </select>
          </label>

          <div className="filter-divider" />

          <div className="data-source-note">
            {loading ? (
              <span className="source-live">⟳ Fetching live data…</span>
            ) : error ? (
              <span className="source-static">📦 Using estimated data</span>
            ) : locations[0]?.isLive ? (
              <span className="source-live">🟢 Live OSM + OSRM data</span>
            ) : (
              <span className="source-static">📦 Using estimated data</span>
            )}
          </div>

          <div className="filter-divider" />

          <Link to="/preferences" className="edit-prefs-btn">
            ✏️ Edit Preferences
          </Link>

          <p className="data-disclaimer">
            Commute times via OSRM · Amenity counts via OpenStreetMap ·
            Safety & lifestyle scores are estimates
          </p>
        </div>

        {/* Results pane */}
        <div className="results">
          <div className="results-header">
            <div>
              <h1>Recommended Areas</h1>
              <p className="results-summary">
                {scoredLocations.length} neighbourhood{scoredLocations.length !== 1 ? "s" : ""} match
                your criteria · ₹{Number(budgetFilter).toLocaleString()} budget ·{" "}
                {commuteFilter} min commute
                {preferences.workplace ? ` to ${preferences.workplace}` : ""}
              </p>
            </div>
            <div className="view-toggle">
              <button
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
              >
                ☰ List
              </button>
              <button
                className={viewMode === "map" ? "active" : ""}
                onClick={() => setViewMode("map")}
              >
                🗺 Map
              </button>
            </div>
          </div>

          <LiveDataBanner loading={loading} progress={progress} error={error} />

          {viewMode === "map" ? (
            <NeighbourhoodMap
              locations={scoredLocations}
              workplaceCoords={workplaceCoords}
            />
          ) : null}

          {viewMode === "list" || viewMode === "map" ? (
            scoredLocations.length === 0 && !loading ? (
              <div className="empty-state">
                No neighbourhoods match these filters. Try relaxing the budget or commute limit.
              </div>
            ) : (
              viewMode === "list" && (
                loading
                  ? [1, 2, 3].map((n) => <SkeletonCard key={n} />)
                  : scoredLocations.map((loc) => (
                      <LocationCard key={loc.id} location={loc} matchScore={loc.matchScore} />
                    ))
              )
            )
          ) : null}

          {/* Show cards below map too */}
          {viewMode === "map" && scoredLocations.length > 0 && (
            <div className="map-card-list">
              <h3>All matched areas</h3>
              {scoredLocations.map((loc) => (
                <LocationCard key={loc.id} location={loc} matchScore={loc.matchScore} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}

export default Dashboard;
