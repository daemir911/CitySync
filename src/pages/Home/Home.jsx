import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {

  const navigate = useNavigate();

  return (
    <>
      <Navbar />

      <section className="hero">
        <h1>Find Where You Should Actually Live</h1>

        <p>
          Discover the best locality based on budget,
          commute, safety and lifestyle.
        </p>

        <button
          onClick={() => navigate("/preferences")}
        >
          Get Started
        </button>
      </section>

      <section className="features">

        <div className="card">
          <h3>🚇 Commute Analysis</h3>
          <p>See exactly how long your daily trip takes by metro, car, or bus — not just straight-line distance.</p>
        </div>

        <div className="card">
          <h3>🏠 Budget Match</h3>
          <p>Filter neighbourhoods that actually fit your rent budget, not just the ones that look affordable.</p>
        </div>

        <div className="card">
          <h3>🛡️ Safety Score</h3>
          <p>Real safety ratings for each area so you know the tradeoffs before you sign a lease.</p>
        </div>

        <div className="card">
          <h3>❤️ Lifestyle Match</h3>
          <p>Student, couple, or family — we weight what matters to your household and rank areas accordingly.</p>
        </div>

      </section>

      <section className="how-it-works">
        <h2>How it works</h2>
        <div className="steps">
          <div className="step">
            <span className="step-num">1</span>
            <div>
              <strong>Tell us your setup</strong>
              <p>Where you work, your budget, how you commute, and your household type.</p>
            </div>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <div>
              <strong>Get ranked neighbourhoods</strong>
              <p>CitySync scores every area against your real constraints and sorts them by fit.</p>
            </div>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <div>
              <strong>Compare and shortlist</strong>
              <p>Dive into area details, compare side by side, and save your favourites.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Home;