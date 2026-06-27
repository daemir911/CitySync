import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useLocations } from "../../context/LocationsContext";
import "./Compare.css";

const METRICS = [
  { key: "rent", label: "Rent (₹/mo)", higherIsBetter: false, format: (v) => `₹${v.toLocaleString()}` },
  { key: "commute", label: "Commute (min)", higherIsBetter: false, format: (v) => `${v} min` },
  { key: "safety", label: "Safety", higherIsBetter: true, format: (v) => `${v}/10` },
  { key: "transit", label: "Transit", higherIsBetter: true, format: (v) => `${v}/10` },
  { key: "amenities", label: "Amenities", higherIsBetter: true, format: (v) => `${v}/10` },
  { key: "schools", label: "Schools", higherIsBetter: true, format: (v) => `${v}/10` },
  { key: "parks", label: "Parks", higherIsBetter: true, format: (v) => `${v}/10` },
  { key: "nightlife", label: "Nightlife", higherIsBetter: true, format: (v) => `${v}/10` },
  { key: "familyFriendly", label: "Family Friendly", higherIsBetter: true, format: (v) => `${v}/10` },
  { key: "coupleFriendly", label: "Couple Friendly", higherIsBetter: true, format: (v) => `${v}/10` },
  { key: "studentFriendly", label: "Student Friendly", higherIsBetter: true, format: (v) => `${v}/10` },
];

function winClass(a, b, higherIsBetter) {
  if (a === b) return { a: "tie", b: "tie" };
  const aWins = higherIsBetter ? a > b : a < b;
  return aWins ? { a: "winner", b: "loser" } : { a: "loser", b: "winner" };
}

function Compare() {
  const { locations } = useLocations();

  // Guard against empty locations (direct navigation before Dashboard hydrates)
  if (!locations.length) {
    return (
      <>
        <Navbar />
        <div className="compare-page">
          <h1 className="compare-title">Compare Neighbourhoods</h1>
          <p className="compare-subtitle">Visit the Dashboard first to load neighbourhood data.</p>
          <Link to="/dashboard" className="details-link" style={{ marginTop: 16, display: "inline-block" }}>
            → Go to Dashboard
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const [firstId, setFirstId] = useState(locations[0].id);
  const [secondId, setSecondId] = useState(locations[1]?.id ?? locations[0].id);

  const first = useMemo(() => locations.find((l) => l.id === firstId), [locations, firstId]);
  const second = useMemo(() => locations.find((l) => l.id === secondId), [locations, secondId]);

  const sameArea = firstId === secondId;

  const wins = useMemo(() => {
    if (!first || !second || sameArea) return { first: 0, second: 0 };
    let f = 0, s = 0;
    METRICS.forEach(({ key, higherIsBetter }) => {
      if (first[key] === second[key]) return;
      const fWins = higherIsBetter ? first[key] > second[key] : first[key] < second[key];
      if (fWins) f++; else s++;
    });
    return { first: f, second: s };
  }, [first, second, sameArea]);

  return (
    <>
      <Navbar />

      <div className="compare-page">
        <h1 className="compare-title">Compare Neighbourhoods</h1>
        <p className="compare-subtitle">Pick two areas and see exactly where they differ.</p>

        <div className="compare-selectors">
          <select
            value={firstId}
            onChange={(e) => setFirstId(Number(e.target.value))}
            className="area-select"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>

          <span className="vs-badge">VS</span>

          <select
            value={secondId}
            onChange={(e) => setSecondId(Number(e.target.value))}
            className="area-select"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {first && second && (
          <>
            {sameArea && (
              <div className="same-area-warning">
                ⚠️ You've selected the same area twice. Pick two different neighbourhoods to compare.
              </div>
            )}
            {/* winner bar */}
            <div className="winner-banner">
              <div className={`winner-side ${wins.first > wins.second ? "active" : ""}`}>
                {first.name}
                <span className="wins-count">{wins.first} wins</span>
              </div>
              <div className="winner-divider" />
              <div className={`winner-side ${wins.second > wins.first ? "active" : ""}`}>
                {second.name}
                <span className="wins-count">{wins.second} wins</span>
              </div>
            </div>

            <div className="compare-descriptions">
              <div className="desc-block">
                <strong>{first.name}</strong>
                <p>{first.description}</p>
                <Link to={`/details/${first.id}`} className="details-link">View full details →</Link>
              </div>
              <div className="desc-block">
                <strong>{second.name}</strong>
                <p>{second.description}</p>
                <Link to={`/details/${second.id}`} className="details-link">View full details →</Link>
              </div>
            </div>

            <div className="compare-table">
              <div className="compare-header">
                <div />
                <div className="col-head">{first.name}</div>
                <div className="col-head">{second.name}</div>
              </div>

              {METRICS.map(({ key, label, higherIsBetter, format }) => {
                const cls = winClass(first[key], second[key], higherIsBetter);
                return (
                  <div key={key} className="compare-row">
                    <div className="row-label">{label}</div>
                    <div className={`row-value ${cls.a}`}>
                      {format(first[key])}
                      {cls.a === "winner" && <span className="badge-win">✓</span>}
                    </div>
                    <div className={`row-value ${cls.b}`}>
                      {format(second[key])}
                      {cls.b === "winner" && <span className="badge-win">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Transport */}
            <div className="compare-extras">
              <div className="extra-block">
                <h4>Transport Options</h4>
                <div className="tag-row">
                  {(first.transportOptions || []).map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
              </div>
              <div className="extra-block">
                <h4>Transport Options</h4>
                <div className="tag-row">
                  {(second.transportOptions || []).map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </>
  );
}

export default Compare;
