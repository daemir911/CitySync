import { Link } from "react-router-dom";
import { buildRecommendationReason } from "../../utils/recommendations";
import "./BestFitCard.css";

/**
 * Highlighted "best fit" card shown at the top of Dashboard.
 * Shows the #1 ranked location with a plain-English reason.
 */
function BestFitCard({ location, preferences }) {
  if (!location) return null;

  const reason = buildRecommendationReason(location, preferences);
  const extraDests = (preferences?.extraDestinations || []).filter((d) => d.place);

  return (
    <div className="bestfit-card">
      <div className="bestfit-ribbon">⭐ Best Match</div>

      <div className="bestfit-top">
        <div className="bestfit-info">
          <h2 className="bestfit-name">{location.name}</h2>
          <p className="bestfit-reason">{reason}</p>
        </div>
        <div className="bestfit-score">
          {location.matchScore}%
          <span className="bestfit-score-label">Match</span>
        </div>
      </div>

      <div className="bestfit-stats">
        {location.rent > 0 && (
          <div className="bestfit-stat">
            <span className="bs-icon">💰</span>
            <div>
              <span className="bs-val">₹{location.rent.toLocaleString()}/mo</span>
              <span className="bs-label">Estimated rent</span>
            </div>
          </div>
        )}
        {location.commute > 0 && (
          <div className="bestfit-stat">
            <span className="bs-icon">🚇</span>
            <div>
              <span className="bs-val">{location.commute} min</span>
              <span className="bs-label">
                {extraDests.length > 0 ? `avg across ${extraDests.length + 1} destinations` : "commute to work"}
              </span>
            </div>
          </div>
        )}
        <div className="bestfit-stat">
          <span className="bs-icon">🛡️</span>
          <div>
            <span className="bs-val">{location.safety}/10</span>
            <span className="bs-label">Safety score</span>
          </div>
        </div>
        <div className="bestfit-stat">
          <span className="bs-icon">🏥</span>
          <div>
            <span className="bs-val">{location.amenities}/10</span>
            <span className="bs-label">Amenities</span>
          </div>
        </div>
      </div>

      {extraDests.length > 0 && (
        <div className="bestfit-dests">
          <span className="bestfit-dests-label">Commute averaged across:</span>
          <span className="bestfit-dest-tag">🏢 {preferences.workplace}</span>
          {extraDests.map((d, i) => (
            <span key={i} className="bestfit-dest-tag">📍 {d.label || d.place}</span>
          ))}
        </div>
      )}

      <div className="bestfit-actions">
        <Link to={`/details/${location.id}`} className="bestfit-btn-primary">
          View Full Details →
        </Link>
      </div>
    </div>
  );
}

export default BestFitCard;
