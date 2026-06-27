import { useMemo, useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import LocationCard from "../../components/LocationCard/LocationCard";
import NeighbourhoodMap from "../../components/Map/NeighbourhoodMap";
import LiveDataBanner from "../../components/LiveDataBanner/LiveDataBanner";
import SkeletonCard from "../../components/SkeletonCard/SkeletonCard";
import RangeSlider from "../../components/RangeSlider/RangeSlider";
import { calculateMatchScore } from "../../utils/recommendations";
import { useEnrichedLocations } from "../../hooks/useEnrichedLocations";
import { useLocations } from "../../context/LocationsContext";
import "./Dashboard.css";

function Dashboard() {
  const routerLocation = useLocation();

  // Persist preferences in sessionStorage so refresh doesn't reset everything
  const preferences = useMemo(() => {
    const fromRoute = routerLocation.state?.preferences;
    if (fromRoute) {
      sessionStorage.setItem("citysync_prefs", JSON.stringify(fromRoute));
      return fromRoute;
    }
    const stored = sessionStorage.getItem("citysync_prefs");
    if (stored) return JSON.parse(stored);
    return {
      budget: 35000,
      maxCommute: 60,
      household: "Student",
      transport: "Car",
      workplace: "Connaught Place, New Delhi",
      movingTo: "",
    };
  }, [routerLocation.state?.preferences]);

  const [budgetRange, setBudgetRange] = useState([
    preferences.minBudget || 5000,
    preferences.budget || 35000,
  ]);
  const [commuteRange, setCommuteRange] = useState([
    preferences.minCommute || 0,
    preferences.maxCommute || 60,
  ]);
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
    const [minBudget, maxBudget] = budgetRange;
    const [minCommute, maxCommute] = commuteRange;

    return locations
      .map((loc) => ({
        ...loc,
        matchScore: calculateMatchScore(loc, {
          ...preferences,
          budget: maxBudget,
          maxCommute,
          household: householdFilter,
        }),
      }))
      .filter((loc) => {
        // Dynamic locations start with rent:0 while Overpass is loading — don't filter them out
        const rentOk = loc.isDynamic && loc.rent === 0
          ? true
          : loc.rent >= minBudget && loc.rent <= maxBudget;
        const commuteOk = loc.commute === 0
          ? true
          : loc.commute >= minCommute && loc.commute <= maxCommute;
        return rentOk && commuteOk;
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [locations, budgetRange, commuteRange, householdFilter, preferences]);

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

          <div className="filter-group">
            <span className="filter-label">Budget</span>
            <RangeSlider
              min={5000}
              max={60000}
              step={1000}
              value={budgetRange}
              onChange={setBudgetRange}
              format={(v) => `₹${v.toLocaleString()}`}
            />
          </div>

          <div className="filter-group">
            <span className="filter-label">Commute time</span>
            <RangeSlider
              min={0}
              max={120}
              step={5}
              value={commuteRange}
              onChange={setCommuteRange}
              format={(v) => `${v} min`}
            />
          </div>

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
              <h1>
                Recommended Areas
                {preferences.movingTo && (
                  <span className="city-badge"> in {preferences.movingTo}</span>
                )}
              </h1>
              <p className="results-summary">
                {scoredLocations.length} neighbourhood{scoredLocations.length !== 1 ? "s" : ""} match
                your criteria · ₹{budgetRange[0].toLocaleString()}–₹{budgetRange[1].toLocaleString()} ·{" "}
                {commuteRange[0]}–{commuteRange[1]} min commute
                {preferences.workplace ? ` to ${preferences.workplace}` : ""}
              </p>
              {locations[0]?.isDynamic && !loading && (
                <p className="dynamic-note">
                  🔍 Showing real neighbourhoods found in {preferences.movingTo} via OpenStreetMap
                </p>
              )}
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
