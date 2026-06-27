import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import "./Preferences.css";

const initialPreferences = {
  currentCity: "Delhi",
  movingTo: "Noida",
  workplace: "Connaught Place, New Delhi",
  budget: 35000,
  transport: "Car",
  household: "Student",
  maxCommute: 60,
};

function Preferences() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialPreferences);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/dashboard", { state: { preferences: formData } });
  };

  return (
    <>
      <Navbar />

      <div className="form-container">
        <h1>Your Preferences</h1>
        <p className="form-description">
          Tell us about your routine and budget so CitySync can suggest areas that really fit.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Current City</label>
              <input name="currentCity" value={formData.currentCity} onChange={handleChange} placeholder="e.g. Delhi" />
            </div>
            <div className="form-group">
              <label>Moving To</label>
              <input name="movingTo" value={formData.movingTo} onChange={handleChange} placeholder="e.g. Noida" />
            </div>
          </div>

          <div className="form-group">
            <label>Workplace / Office Area</label>
            <input name="workplace" value={formData.workplace} onChange={handleChange} placeholder="e.g. Sector 62" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Monthly Budget (₹)</label>
              <input name="budget" type="number" value={formData.budget} onChange={handleChange} placeholder="e.g. 18000" />
            </div>
            <div className="form-group">
              <label>Max Commute (min)</label>
              <input name="maxCommute" type="number" value={formData.maxCommute} onChange={handleChange} placeholder="e.g. 30" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Transport Mode</label>
              <select name="transport" value={formData.transport} onChange={handleChange}>
                <option value="Metro">Metro</option>
                <option value="Bus">Bus</option>
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
              </select>
            </div>
            <div className="form-group">
              <label>Household Type</label>
              <select name="household" value={formData.household} onChange={handleChange}>
                <option value="Student">Student</option>
                <option value="Family">Family</option>
                <option value="Couple">Couple</option>
              </select>
            </div>
          </div>

          <button type="submit">Find Locations →</button>
        </form>
      </div>

      <Footer />
    </>
  );
}

export default Preferences;