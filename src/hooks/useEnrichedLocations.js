/**
 * useEnrichedLocations
 *
 * Two modes:
 * 1. Static mode  — user is moving to a city already in our dataset
 *                   (Noida, Delhi, Bengaluru, Mumbai). Uses the 8 hardcoded
 *                   locations as the base and enriches with live data.
 *
 * 2. Dynamic mode — user typed any other Indian city. Searches Nominatim for
 *                   real neighbourhoods there, then fetches live commute +
 *                   amenity data for each one from scratch.
 *
 * In both modes results are patched progressively so the UI updates as data
 * arrives instead of waiting for everything.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { geocode, searchNeighbourhoods } from "../services/geocoding";
import { batchCommuteToWorkplace } from "../services/routing";
import { getAmenityProfile } from "../services/overpass";
import { locations as staticLocations } from "../data/locations";

const STATIC_CITIES = ["noida", "delhi", "bengaluru", "bangalore", "mumbai", "bombay"];
const GEOCODE_STAGGER_MS = 350;
const OVERPASS_STAGGER_MS = 600;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cityFromPrefs(prefs) {
  return (prefs?.movingTo || "").split(",")[0].toLowerCase().trim();
}

function isStaticCity(city) {
  return STATIC_CITIES.some((c) => city.includes(c) || c.includes(city));
}

export function useEnrichedLocations(preferences) {
  const [locations, setLocations] = useState(staticLocations);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ step: "", done: 0, total: 0 });
  const [error, setError] = useState(null);
  const abortRef = useRef(false);

  const patchLocation = useCallback((idOrFn, patch) => {
    if (typeof idOrFn === "function") {
      setLocations(idOrFn);
    } else {
      setLocations((prev) =>
        prev.map((l) => (l.id === idOrFn ? { ...l, ...patch } : l))
      );
    }
  }, []);

  useEffect(() => {
    if (!preferences?.workplace) return;

    abortRef.current = false;
    setLoading(true);
    setError(null);

    const city = cityFromPrefs(preferences);
    const useDynamic = city && !isStaticCity(city);

    // Seed with appropriate base locations
    setLocations(useDynamic ? [] : staticLocations);

    // Also pass the clean city name to searchNeighbourhoods
    const cityForSearch = preferences.movingTo?.split(",")[0].trim() || city;

    async function enrich() {
      try {
        const total = useDynamic ? 10 : staticLocations.length;

        // ── Step 1: Geocode workplace ────────────────────────────────────────
        setProgress({ step: "Locating your workplace…", done: 0, total });
        const workplaceCoords = await geocode(preferences.workplace);
        if (abortRef.current) return;
        if (!workplaceCoords) {
          throw new Error(
            `Could not find "${preferences.workplace}" — check the spelling.`
          );
        }

        // ── Step 2: Get base locations ───────────────────────────────────────
        let baseLocations;

        if (useDynamic) {
          setProgress({ step: `Searching neighbourhoods in ${cityForSearch}…`, done: 0, total });
          const found = await searchNeighbourhoods(cityForSearch, 10);
          if (abortRef.current) return;

          if (!found.length) {
            // Fall back to showing static locations with a warning instead of hard error
            setLocations(staticLocations);
            setError(`No neighbourhoods found for "${cityForSearch}" — showing our curated dataset instead.`);
            setLoading(false);
            return;
          }

          // Assign stable numeric IDs
          baseLocations = found.map((l, i) => ({ ...l, id: 1000 + i }));
          setLocations(baseLocations);
        } else {
          baseLocations = staticLocations;

          // Geocode static locations in parallel (staggered)
          setProgress({ step: "Locating neighbourhoods…", done: 0, total });
          await Promise.all(
            baseLocations.map(async (loc, i) => {
              await sleep(i * GEOCODE_STAGGER_MS);
              if (abortRef.current) return;
              const coords = await geocode(loc.name);
              if (coords) patchLocation(loc.id, { lat: coords.lat, lon: coords.lon });
            })
          );
          if (abortRef.current) return;
        }

        // ── Step 3: Commute times (OSRM) ────────────────────────────────────
        setProgress({ step: "Calculating commute times…", done: 0, total });

        const coordsForRouting = baseLocations
          .filter((l) => l.lat && l.lon)
          .map((l) => ({ id: l.id, lat: l.lat, lon: l.lon }));

        const commuteTimes = await batchCommuteToWorkplace(
          coordsForRouting,
          workplaceCoords.lat,
          workplaceCoords.lon,
          preferences.transport || "Car"
        );
        if (abortRef.current) return;

        commuteTimes.forEach(({ id, commute }) => {
          if (commute !== null) patchLocation(id, { commute, isLive: true });
        });

        // ── Step 4: Amenity profiles (Overpass) ──────────────────────────────
        setProgress({ step: "Fetching live amenity data…", done: 0, total });

        let done = 0;
        await Promise.all(
          baseLocations.map(async (loc, i) => {
            if (!loc.lat || !loc.lon) return;
            await sleep(i * OVERPASS_STAGGER_MS);
            if (abortRef.current) return;

            const amenityData = await getAmenityProfile(loc.lat, loc.lon, 1500);
            done++;
            setProgress({ step: "Fetching live amenity data…", done, total });
            if (!amenityData) return;

            const patch = {
              amenities: amenityData.scores?.amenities ?? loc.amenities,
              transit:   amenityData.scores?.transit   ?? loc.transit,
              isLive: true,
              liveData: amenityData.raw ? { ...amenityData.raw } : null,
            };

            // For dynamic locations also derive lifestyle scores + estimated rent from amenity data
            if (loc.isDynamic) {
              const edu     = amenityData.scores?.educationScore   ?? 7;
              const park    = amenityData.scores?.leisureScore     ?? 6;
              const night   = amenityData.scores?.foodScore        ?? 6;
              const health  = amenityData.scores?.healthcareScore  ?? 7;
              const transit = amenityData.scores?.transitScore     ?? 6;
              patch.schools         = edu;
              patch.parks           = park;
              patch.nightlife       = night;
              patch.safety          = parseFloat(((health + (amenityData.scores?.amenities ?? 7)) / 2).toFixed(1));
              patch.transit         = transit;
              patch.familyFriendly  = parseFloat(((edu + park + health) / 3).toFixed(1));
              patch.coupleFriendly  = parseFloat(((night + park + amenityData.scores?.amenities) / 3).toFixed(1));
              patch.studentFriendly = parseFloat(((edu + night + transit) / 3).toFixed(1));
              patch.description     = buildDescription(loc.name, amenityData.raw);
              patch.highlights      = buildHighlights(amenityData.raw);

              // Estimate rent from amenity density — more amenities = higher rent area
              const amenityDensity = (amenityData.raw?.food ?? 0) + (amenityData.raw?.grocery ?? 0) + (amenityData.raw?.healthcare ?? 0);
              const baseRent = 12000;
              const rentFactor = Math.min(amenityDensity / 30, 2.5); // cap at 2.5x
              patch.rent = Math.round((baseRent + baseRent * rentFactor) / 1000) * 1000;
            }

            patchLocation(loc.id, patch);
          })
        );

        if (abortRef.current) return;
        setProgress({ step: "Done", done: total, total });
      } catch (err) {
        if (!abortRef.current) {
          setError(err.message || "Failed to fetch live data");
          if (!useDynamic) setLocations(staticLocations);
        }
      } finally {
        if (!abortRef.current) setLoading(false);
      }
    }

    enrich();
    return () => { abortRef.current = true; };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences?.workplace, preferences?.transport, preferences?.movingTo]);

  return { locations, loading, progress, error };
}

// ── Helpers for dynamic location descriptions ──────────────────────────────

function buildDescription(name, raw) {
  const parts = [];
  if (raw?.food > 10)       parts.push("a strong food and café scene");
  if (raw?.healthcare > 5)  parts.push("good healthcare access");
  if (raw?.education > 5)   parts.push("schools and colleges nearby");
  if (raw?.leisure > 5)     parts.push("parks and leisure facilities");
  if (raw?.transport > 3)   parts.push("decent public transport links");
  if (!parts.length)        return `A neighbourhood in ${name.split(",")[1]?.trim() || "the city"}.`;
  return `${name.split(",")[0]} has ${parts.slice(0, 3).join(", ")}.`;
}

function buildHighlights(raw) {
  const h = [];
  if (raw?.healthcare > 3)  h.push("Healthcare facilities nearby");
  if (raw?.education > 3)   h.push("Schools & colleges");
  if (raw?.grocery > 3)     h.push("Grocery & daily essentials");
  if (raw?.food > 10)       h.push("Restaurants & cafes");
  if (raw?.leisure > 3)     h.push("Parks & recreation");
  if (raw?.transport > 2)   h.push("Public transit access");
  return h.slice(0, 5);
}
