import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const STATS = [
  { value: "Any city", label: "in India" },
  { value: "Live", label: "commute times" },
  { value: "OSM", label: "amenity data" },
  { value: "1 answer", label: "not 5 tools" },
];

const FEATURES = [
  { icon: "🚇", title: "Real Commute Times", desc: "Calculated via OSRM routing — by car, metro, bus, or bike. Not straight-line guesses." },
  { icon: "💰", title: "Budget Match", desc: "Set a range. Only areas that actually fit your rent show up — no wasted scrolling." },
  { icon: "🛡️", title: "Safety Score", desc: "Live safety data for each area so you understand the tradeoffs before signing anything." },
  { icon: "❤️", title: "Lifestyle Fit", desc: "Student, couple, or family — scores are weighted for what matters to your household." },
];

function Home() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-left">
          <div className="hero-eyebrow">🏙️ CitySync</div>
          <h1>Find where you should <em>actually</em> live</h1>
          <p>
            Most rental apps show price and size. CitySync tells you how long your commute will be,
            what the area is like to live in, and whether it fits your household — in one place.
          </p>
          <div className="hero-actions">
            <button className="hero-btn-primary" onClick={() => navigate("/preferences")}>
              Get started →
            </button>
            <button className="hero-btn-ghost" onClick={() => navigate("/dashboard")}>
              Browse areas
            </button>
          </div>
          <div className="hero-stats">
            {STATS.map((s) => (
              <div key={s.label} className="hero-stat">
                <span className="hs-val">{s.value}</span>
                <span className="hs-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-right" aria-hidden="true">
          <div className="city-visual">
            <div className="cv-card cv-top">
              <div className="cv-match">92%</div>
              <div className="cv-info">
                <strong>Indiranagar, Bengaluru</strong>
                <span>18 min · ₹22,000/mo · Safety 9/10</span>
              </div>
            </div>
            <div className="cv-card cv-mid">
              <div className="cv-match cv-amber">74%</div>
              <div className="cv-info">
                <strong>Koramangala</strong>
                <span>26 min · ₹28,000/mo · Safety 8/10</span>
              </div>
            </div>
            <div className="cv-card cv-bot">
              <div className="cv-match cv-red">51%</div>
              <div className="cv-info">
                <strong>Whitefield</strong>
                <span>54 min · ₹18,000/mo · Safety 7/10</span>
              </div>
            </div>
            <div className="cv-pulse" />
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section className="features-section">
        <div className="section-label">What we solve</div>
        <h2>Everything in one place</h2>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <span className="fc-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────── */}
      <section className="how-section">
        <div className="section-label">Process</div>
        <h2>Three steps, one answer</h2>
        <div className="steps-row">
          <div className="step-card">
            <div className="step-num">01</div>
            <h3>Tell us your setup</h3>
            <p>Where you're moving, where you work, your budget, transport, and household type.</p>
          </div>
          <div className="step-connector" />
          <div className="step-card">
            <div className="step-num">02</div>
            <h3>We fetch real data</h3>
            <p>Live commute times via OSRM. Amenity counts from OpenStreetMap. For any Indian city.</p>
          </div>
          <div className="step-connector" />
          <div className="step-card">
            <div className="step-num">03</div>
            <h3>Get your answer</h3>
            <p>Ranked neighbourhoods with a clear best pick, score breakdown, and property links.</p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Home;
