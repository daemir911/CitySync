/**
 * useEnrichedLocations
 * Geocodes locations, fetches real commute times (OSRM) and
 * live amenity scores (Overpass) — updates UI progressively as each completes.
 *
 * Strategy:
 * - Geocoding: parallel with 300ms stagger (Nominatim is lenient for small batches)
 * - OSRM: fully parallel (no rate limit)
 * - Overpass: parallel with 500ms stagger, one query per location
 * - If any step times out or errors, falls back to static data for that location
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { geocode } from "../services/geocoding";
import { batchCommuteToWorkplace } from "../services/routing";
import { getAmenityProfile } from "../services/overpass";
import { locations as staticLocations } from "../data/locations";

const GEOCODE_STAGGER_MS = 350;  // gentle stagger for Nominatim
const OVERPASS_STAGGER_MS = 600; // stagger Overpass calls to avoid 429

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function useEnrichedLocations(preferences) {
  const [locations, setLocations] = useState(staticLocations);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ step: "", done: 0, total: 0 });
  const [error, setError] = useState(null);
  const abortRef = useRef(false);

  // Merge a partial update for one location into state
  const patchLocation = useCallback((id, patch) => {
    setLocations((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  }, []);

  useEffect(() => {
    if (!preferences?.workplace) return;

    abortRef.current = false;
    setLoading(true);
    setError(null);
    // Start from static data each time preferences change
    setLocations(staticLocations);

    async function enrich() {
      try {
        const total = staticLocations.length;

        // ── Step 1: Geocode workplace ────────────────────────────────────────
        setProgress({ step: "Locating your workplace…", done: 0, total });
        const workplaceCoords = await geocode(preferences.workplace);
        if (abortRef.current) return;
        if (!workplaceCoords) {
          throw new Error(`Could not find "${preferences.workplace}" — check the spelling and try again.`);
        }

        // ── Step 2: Geocode all locations in parallel (staggered) ────────────
        setProgress({ step: "Locating neighbourhoods…", done: 0, total });

        const coordEntries = await Promise.all(
          staticLocations.map(async (loc, i) => {
            await sleep(i * GEOCODE_STAGGER_MS);
            if (abortRef.current) return { id: loc.id, coords: null };
            const coords = await geocode(loc.name);
            if (coords) {
              // Immediately patch lat/lon so map pins appear early
              patchLocation(loc.id, { lat: coords.lat, lon: coords.lon });
            }
            return { id: loc.id, coords };
          })
        );
        if (abortRef.current) return;

        const coordMap = {};
        coordEntries.forEach(({ id, coords }) => {
          if (coords) coordMap[id] = coords;
        });

        // ── Step 3: Commute times (OSRM — fully parallel, fast) ──────────────
        setProgress({ step: "Calculating commute times…", done: 0, total });

        const locationCoords = staticLocations
          .filter((l) => coordMap[l.id])
          .map((l) => ({ id: l.id, ...coordMap[l.id] }));

        const commuteTimes = await batchCommuteToWorkplace(
          locationCoords,
          workplaceCoords.lat,
          workplaceCoords.lon,
          preferences.transport || "Car"
        );
        if (abortRef.current) return;

        commuteTimes.forEach(({ id, commute }) => {
          if (commute !== null) patchLocation(id, { commute, isLive: true });
        });

        // ── Step 4: Amenity profiles (Overpass — staggered parallel) ─────────
        setProgress({ step: "Fetching live amenity data…", done: 0, total });

        let done = 0;
        await Promise.all(
          staticLocations.map(async (loc, i) => {
            const coords = coordMap[loc.id];
            if (!coords) return;

            await sleep(i * OVERPASS_STAGGER_MS);
            if (abortRef.current) return;

            const amenityData = await getAmenityProfile(coords.lat, coords.lon, 1500);

            done++;
            setProgress({ step: "Fetching live amenity data…", done, total });

            if (!amenityData) return; // timed out — keep static scores

            patchLocation(loc.id, {
              amenities: amenityData.scores?.amenities ?? loc.amenities,
              transit: amenityData.scores?.transit ?? loc.transit,
              liveData: amenityData.raw
                ? {
                    healthcare: amenityData.raw.healthcare ?? 0,
                    education:  amenityData.raw.education  ?? 0,
                    grocery:    amenityData.raw.grocery    ?? 0,
                    food:       amenityData.raw.food       ?? 0,
                    leisure:    amenityData.raw.leisure    ?? 0,
                    transport:  amenityData.raw.transport  ?? 0,
                  }
                : null,
              isLive: true,
            });
          })
        );

        if (abortRef.current) return;
        setProgress({ step: "Done", done: total, total });
      } catch (err) {
        if (!abortRef.current) {
          setError(err.message || "Failed to fetch live data");
          setLocations(staticLocations);
        }
      } finally {
        if (!abortRef.current) setLoading(false);
      }
    }

    enrich();

    return () => {
      abortRef.current = true;
    };
  }, [preferences?.workplace, preferences?.transport, patchLocation]);

  return { locations, loading, progress, error };
}
