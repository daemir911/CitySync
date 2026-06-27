import { useState, useEffect, useRef } from "react";
import "./Autocomplete.css";

const NOMINATIM = "https://nominatim.openstreetmap.org";

/**
 * Debounce helper
 */
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Autocomplete input backed by Nominatim.
 * Props: name, value, onChange, placeholder, required, hint
 * onChange fires with a synthetic event { target: { name, value } }
 */
function Autocomplete({ name, value, onChange, placeholder, required, hint, label }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const cacheRef = useRef({});

  const debouncedQuery = useDebounce(query, 280);

  // Sync external value changes (e.g. reset)
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Fetch suggestions
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const cacheKey = debouncedQuery.toLowerCase();
    if (cacheRef.current[cacheKey]) {
      setSuggestions(cacheRef.current[cacheKey]);
      setOpen(true);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(
      `${NOMINATIM}/search?q=${encodeURIComponent(debouncedQuery)}&format=json&limit=6&countrycodes=in&addressdetails=1`,
      { headers: { "User-Agent": "CitySync/1.0" } }
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        // Build clean labels from address parts
        const results = data.map((item) => {
          const a = item.address || {};
          const parts = [
            a.suburb || a.neighbourhood || a.quarter,
            a.city || a.town || a.village || a.county,
            a.state,
          ].filter(Boolean);
          return {
            label: parts.join(", ") || item.display_name.split(",").slice(0, 2).join(",").trim(),
            full: item.display_name,
            lat: item.lat,
            lon: item.lon,
          };
        });
        // Deduplicate by label
        const seen = new Set();
        const unique = results.filter((r) => {
          if (seen.has(r.label)) return false;
          seen.add(r.label);
          return true;
        });
        cacheRef.current[cacheKey] = unique;
        setSuggestions(unique);
        setOpen(unique.length > 0);
        setActiveIdx(-1);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (suggestion) => {
    setQuery(suggestion.label);
    setSuggestions([]);
    setOpen(false);
    setActiveIdx(-1);
    onChange({ target: { name, value: suggestion.label } });
  };

  const handleInput = (e) => {
    setQuery(e.target.value);
    onChange({ target: { name, value: e.target.value } });
  };

  const handleKeyDown = (e) => {
    if (!open || !suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      select(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="ac-wrap" ref={containerRef}>
      {label && <label className="ac-label">{label}</label>}
      <div className="ac-input-wrap">
        <input
          type="text"
          name={name}
          value={query}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className="ac-input"
        />
        {loading && <span className="ac-spinner" />}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="ac-dropdown" role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={i}
              role="option"
              aria-selected={i === activeIdx}
              className={`ac-item ${i === activeIdx ? "active" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); select(s); }}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <span className="ac-pin">📍</span>
              <span className="ac-label-text">{s.label}</span>
            </li>
          ))}
        </ul>
      )}
      {hint && <span className="ac-hint">{hint}</span>}
    </div>
  );
}

export default Autocomplete;
