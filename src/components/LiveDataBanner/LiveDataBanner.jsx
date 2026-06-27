import "./LiveDataBanner.css";

function LiveDataBanner({ loading, progress, error }) {
  if (!loading && !error) return null;

  if (error) {
    return (
      <div className="live-banner error">
        <span className="banner-icon">⚠️</span>
        <div>
          <strong>Live data unavailable</strong>
          <p>{error} — showing estimated scores.</p>
        </div>
      </div>
    );
  }

  const pct =
    progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 5; // show a sliver immediately

  return (
    <div className="live-banner loading">
      <span className="spinner" />
      <div className="banner-text">
        <strong>{progress.step || "Loading live data…"}</strong>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        {progress.total > 0 && (
          <span className="progress-label">
            {progress.done} / {progress.total} areas
          </span>
        )}
      </div>
    </div>
  );
}

export default LiveDataBanner;
