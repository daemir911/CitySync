import "./SkeletonCard.css";

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-top">
        <div>
          <div className="sk sk-title" />
          <div className="sk sk-desc" />
          <div className="sk sk-desc short" />
        </div>
        <div className="sk sk-badge" />
      </div>
      <div className="sk-chips">
        <div className="sk sk-chip" />
        <div className="sk sk-chip" />
        <div className="sk sk-chip" />
      </div>
      <div className="sk-bars">
        <div className="sk sk-bar" />
        <div className="sk sk-bar" />
        <div className="sk sk-bar" />
      </div>
    </div>
  );
}

export default SkeletonCard;
