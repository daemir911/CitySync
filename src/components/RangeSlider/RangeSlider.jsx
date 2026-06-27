import { useRef, useCallback } from "react";
import "./RangeSlider.css";

/**
 * Dual-handle range slider (like Amazon price filter).
 * Props:
 *   min, max, step
 *   value: [low, high]
 *   onChange: ([low, high]) => void
 *   format: (v) => string  — label formatter
 */
function RangeSlider({ min, max, step = 1, value, onChange, format = (v) => v }) {
  const [low, high] = value;
  const trackRef = useRef(null);

  const clamp = (v) => Math.min(max, Math.max(min, v));
  const snap = (v) => Math.round((v - min) / step) * step + min;

  const lowPct = ((low - min) / (max - min)) * 100;
  const highPct = ((high - min) / (max - min)) * 100;

  // Pointer-based drag for each thumb
  const startDrag = useCallback(
    (thumb, e) => {
      e.preventDefault();
      const track = trackRef.current;
      if (!track) return;

      const move = (ev) => {
        const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
        const rect = track.getBoundingClientRect();
        const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        const raw = min + pct * (max - min);
        const snapped = clamp(snap(raw));

        if (thumb === "low") {
          onChange([Math.min(snapped, high - step), high]);
        } else {
          onChange([low, Math.max(snapped, low + step)]);
        }
      };

      const up = () => {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
        window.removeEventListener("touchmove", move);
        window.removeEventListener("touchend", up);
      };

      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
      window.addEventListener("touchmove", move, { passive: false });
      window.addEventListener("touchend", up);
    },
    [low, high, min, max, step, onChange]
  );

  return (
    <div className="rs-wrap">
      {/* Value bubbles */}
      <div className="rs-values">
        <span className="rs-value">{format(low)}</span>
        <span className="rs-dash">–</span>
        <span className="rs-value">{format(high)}</span>
      </div>

      {/* Track */}
      <div className="rs-track" ref={trackRef}>
        {/* Grey background */}
        <div className="rs-track-bg" />

        {/* Blue fill between thumbs */}
        <div
          className="rs-track-fill"
          style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
        />

        {/* Low thumb */}
        <div
          className="rs-thumb"
          style={{ left: `${lowPct}%` }}
          onMouseDown={(e) => startDrag("low", e)}
          onTouchStart={(e) => startDrag("low", e)}
          role="slider"
          aria-valuenow={low}
          aria-valuemin={min}
          aria-valuemax={high}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") onChange([clamp(snap(low + step)), high]);
            if (e.key === "ArrowLeft")  onChange([clamp(snap(low - step)), high]);
          }}
        />

        {/* High thumb */}
        <div
          className="rs-thumb"
          style={{ left: `${highPct}%` }}
          onMouseDown={(e) => startDrag("high", e)}
          onTouchStart={(e) => startDrag("high", e)}
          role="slider"
          aria-valuenow={high}
          aria-valuemin={low}
          aria-valuemax={max}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") onChange([low, clamp(snap(high + step))]);
            if (e.key === "ArrowLeft")  onChange([low, clamp(snap(high - step))]);
          }}
        />
      </div>

      {/* Min / Max labels */}
      <div className="rs-minmax">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

export default RangeSlider;
