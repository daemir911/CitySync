import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import LocationCard from "../../components/LocationCard/LocationCard";
import { locations } from "../../data/locations";
import { calculateMatchScore } from "../../utils/recommendations";
import "./Dashboard.css";

function Dashboard() {
  const location = useLocation();
  const preferences = location.state?.preferences || {
    budget: 18000,
    maxCommute: 30,
    household: "Student",
  };

  const [budgetFilter, setBudgetFilter] = useState(String(preferences.budget || 18000));
  const [commuteFilter, setCommuteFilter] = useState(String(preferences.maxCommute || 30));
  const [householdFilter, setHouseholdFilter] = useState(preferences.household || "Student");

  const scoredLocations = useMemo(() => {
    const parsedBudget = Number(budgetFilter || 20000);
    const parsedCommute = Number(commuteFilter || 45);

    return locations
      .map((locationItem) => ({
        ...locationItem,
        matchScore: calculateMatchScore(locationItem, {
          ...preferences,
          budget: parsedBudget,
          maxCommute: parsedCommute,
          household: householdFilter,
        }),
      }))
      .filter((locationItem) => locationItem.rent <= parsedBudget && locationItem.commute <= parsedCommute)
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [budgetFilter, commuteFilter, householdFilter, preferences]);

  return (
    <>
      <Navbar />

      <div className="dashboard">
        <div className="filters">
          <h2>Filters</h2>
          <p className="filter-copy">Adjust the terms and see which neighborhoods rise to the top.</p>

          <label>
            Budget
            <input type="number" value={budgetFilter} onChange={(e) => setBudgetFilter(e.target.value)} />
          </label>

          <label>
            Max Commute (min)
            <input type="number" value={commuteFilter} onChange={(e) => setCommuteFilter(e.target.value)} />
          </label>

          <label>
            Household
            <select value={householdFilter} onChange={(e) => setHouseholdFilter(e.target.value)}>
              <option value="Student">Student</option>
              <option value="Family">Family</option>
              <option value="Couple">Couple</option>
            </select>
          </label>
        </div>

        <div className="results">
          <h1>Recommended Areas</h1>
          <p className="results-summary">
            Showing {scoredLocations.length} neighborhoods for a {preferences.household || "student"} budget of ₹{budgetFilter} with a {commuteFilter}-minute commute target.
          </p>

          {scoredLocations.length === 0 ? (
            <div className="empty-state">No neighborhoods match these settings yet. Try relaxing the commute or budget filter.</div>
          ) : (
            scoredLocations.map((locationItem) => <LocationCard key={locationItem.id} location={locationItem} matchScore={locationItem.matchScore} />)
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}

export default Dashboard;