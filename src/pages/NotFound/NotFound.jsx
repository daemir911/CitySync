import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import "./NotFound.css";

function NotFound() {
  return (
    <>
      <Navbar />
      <div className="notfound-page">
        <div className="notfound-code">404</div>
        <h1>Page not found</h1>
        <p>This URL doesn't exist in CitySync. Head back and keep exploring.</p>
        <div className="notfound-actions">
          <Link to="/" className="btn-primary">Go Home</Link>
          <Link to="/dashboard" className="btn-outline">Dashboard</Link>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default NotFound;
