import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import Autocomplete from "../../components/Autocomplete/Autocomplete";
import RangeSlider from "../../components/RangeSlider/RangeSlider";
import "./Preferences.css";

const STEPS = [
  {
    id: "destination",
    title: "Where are you moving to?",
    subtitle: "Enter the city you're relocating to and we'll find real neighbourhoods there.",
    icon: "📍",
  },
  {
    id: "work",
    title: "Where do you work?",
    subtitle: "We'll calculate real commute times from each area to your office.",
    icon: "🏢",
  },
  {
    id: "destinations",
    title: "Any other daily destinations?",
    subtitle: "Add places you visit regularly — school, gym, hospital, family. We'll factor all of them into commute scores.",
    icon: "🗺️",
  },
  {
    id: "budget",
    title: "What's your budget & commute limit?",
    subtitle: "We'll only show areas that fit — no wasted scrolling.",
    icon: "💰",
  },
  {
    id: "lifestyle",
    title: "What's your household like?",
    subtitle: "This helps us weight safety, schools, nightlife, and amenities correctly.",
    icon: "🏠",
  },
];

const DESTINATION_PRESETS = ["School / College", "Hospital", "Gym", "Parents' Home", "Market", "Place of Worship"];

const initialPreferences = {
  movingTo: "",
  workplace: "",
  extraDestinations: [], // [{ label, place }]
  budgetRange: [5000, 35000],
  transport: "Car",
  household: "Student",
  commuteRange: [0, 60],
};

function StepDots({ total, current }) {
  return (
    <div className="step-dots">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`step-dot ${i === current ? "active" : i < current ? "done" : ""}`} />
      ))}
    </div>
  );
}

function Preferences() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(initialPreferences);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Extra destinations helpers
  const addDestination = () => {
    if (formData.extraDestinations.length >= 3) return;
    setFormData((p) => ({
      ...p,
      extraDestinations: [...p.extraDestinations, { label: "", place: "" }],
    }));
  };

  const removeDestination = (i) => {
    setFormData((p) => ({
      ...p,
      extraDestinations: p.extraDestinations.filter((_, idx) => idx !== i),
    }));
  };

  const updateDestination = (i, field, value) => {
    setFormData((p) => {
      const updated = [...p.extraDestinations];
      updated[i] = { ...updated[i], [field]: value };
      return { ...p, extraDestinations: updated };
    });
  };

  const next = (e) => {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      navigate("/dashboard", {
        state: {
          preferences: {
            ...formData,
            budget: formData.budgetRange[1],
            minBudget: formData.budgetRange[0],
            maxCommute: formData.commuteRange[1],
            minCommute: formData.commuteRange[0],
          },
        },
      });
    }
  };

  const back = () => { if (step > 0) setStep((s) => s - 1); };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      <Navbar />
      <div className="pref-page">
        <div className="pref-back-row">
          {step === 0 ? (
            <Link to="/" className="pref-back-link">← Back to Home</Link>
          ) : (
            <button className="pref-back-link" onClick={back}>← Back</button>
          )}
          <span className="pref-step-label">Step {step + 1} of {STEPS.length}</span>
        </div>

        <div className="pref-card">
          <div className="pref-card-icon">{current.icon}</div>
          <h1 className="pref-card-title">{current.title}</h1>
          <p className="pref-card-subtitle">{current.subtitle}</p>
          <StepDots total={STEPS.length} current={step} />

          <form onSubmit={next} className="pref-form">

            {/* Step 0 — Destination city */}
            {step === 0 && (
              <Autocomplete
                label="Moving To"
                name="movingTo"
                value={formData.movingTo}
                onChange={handleChange}
                placeholder="e.g. Hyderabad, Pune, Nagpur…"
                hint="Enter any Indian city — we'll find real neighbourhoods there."
                required
              />
            )}

            {/* Step 1 — Workplace + transport */}
            {step === 1 && (
              <>
                <Autocomplete
                  label="Workplace / Office Area"
                  name="workplace"
                  value={formData.workplace}
                  onChange={handleChange}
                  placeholder="e.g. HITEC City, Hyderabad"
                  hint="Be specific — a neighbourhood or landmark works best."
                  required
                />
                <div className="pref-field">
                  <label>How do you commute?</label>
                  <div className="transport-grid">
                    {["Car", "Metro", "Bus", "Bike"].map((t) => (
                      <label key={t} className={`transport-option ${formData.transport === t ? "selected" : ""}`}>
                        <input type="radio" name="transport" value={t} checked={formData.transport === t} onChange={handleChange} />
                        <span className="transport-icon">
                          {t === "Car" ? "🚗" : t === "Metro" ? "🚇" : t === "Bus" ? "🚌" : "🚲"}
                        </span>
                        {t}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 2 — Extra daily destinations */}
            {step === 2 && (
              <div className="pref-field">
                <div className="dest-list">
                  {formData.extraDestinations.map((dest, i) => (
                    <div key={i} className="dest-row">
                      <div className="dest-inputs">
                        {/* Label quick-picks */}
                        <select
                          value={dest.label}
                          onChange={(e) => updateDestination(i, "label", e.target.value)}
                          className="dest-label-select"
                        >
                          <option value="">Type of place…</option>
                          {DESTINATION_PRESETS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                          <option value="Other">Other</option>
                        </select>
                        <Autocomplete
                          name={`dest_${i}`}
                          value={dest.place}
                          onChange={(e) => updateDestination(i, "place", e.target.value)}
                          placeholder="Search location…"
                        />
                      </div>
                      <button type="button" className="dest-remove" onClick={() => removeDestination(i)}>✕</button>
                    </div>
                  ))}
                </div>

                {formData.extraDestinations.length < 3 ? (
                  <button type="button" className="dest-add-btn" onClick={addDestination}>
                    + Add a destination
                  </button>
                ) : (
                  <p className="pref-hint">Maximum 3 extra destinations</p>
                )}

                <p className="pref-hint" style={{ marginTop: 12 }}>
                  Optional — skip if your workplace is your only regular destination.
                </p>
              </div>
            )}

            {/* Step 3 — Budget */}
            {step === 3 && (
              <>
                <div className="pref-field">
                  <label>Monthly Rent Budget</label>
                  <RangeSlider
                    min={5000} max={60000} step={1000}
                    value={formData.budgetRange}
                    onChange={(v) => setFormData((p) => ({ ...p, budgetRange: v }))}
                    format={(v) => `₹${v.toLocaleString()}`}
                  />
                </div>
                <div className="pref-field">
                  <label>Commute Time</label>
                  <RangeSlider
                    min={0} max={120} step={5}
                    value={formData.commuteRange}
                    onChange={(v) => setFormData((p) => ({ ...p, commuteRange: v }))}
                    format={(v) => `${v} min`}
                  />
                </div>
              </>
            )}

            {/* Step 4 — Lifestyle */}
            {step === 4 && (
              <div className="pref-field">
                <label>Household Type</label>
                <div className="household-grid">
                  {[
                    { value: "Student",  icon: "🎓", desc: "Near colleges, budget-friendly, social" },
                    { value: "Couple",   icon: "👫", desc: "Walkable, good food, lively nightlife" },
                    { value: "Family",   icon: "👨‍👩‍👧", desc: "Schools, parks, safe, quiet" },
                    { value: "Balanced", icon: "⚖️", desc: "No bias — scores all factors equally" },
                  ].map(({ value, icon, desc }) => (
                    <label key={value} className={`household-option ${formData.household === value ? "selected" : ""}`}>
                      <input type="radio" name="household" value={value} checked={formData.household === value} onChange={handleChange} />
                      <span className="household-icon">{icon}</span>
                      <strong>{value}</strong>
                      <span className="household-desc">{desc}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="pref-submit">
              {isLast ? "Find My Neighbourhoods →" : "Continue →"}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Preferences;
