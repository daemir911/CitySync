/**
 * useEnrichedLocations
 * Takes the static locations array + user preferences,
 * geocodes each location, fetches live commute times (OSRM)
 * and live amenity scores (Overpass), then returns enriched locations.
 */

import { useState, useEffect, useRef } from "react";
import { geocode } from "../services/geocoding";
import { batchCommuteToWorkplace } from "../services/routing";
import { getAmenityProfile } from "../services/overpass";
import { locations as staticLocations } from "../data/locations";

const RATE_DELAY_MS = 1100; // Nominatim rate limit: 1 req/sec

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {object} preferences - { workplace, transport, ... }
 * @returns {{ locations, loading, progress, error }}
 */
export function useEnrichedLocations(preferences) {
  const [locations, setLocations] = useState(staticLocations);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ step: "", done: 0, total: 0 });
  const [error, setError] = useState(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (!preferences?.workplace) return;

    abortRef.current = false;
    setLoading(true);
    setError(null);

    async function enrich() {
      try {
        // Step 1: Geocode workplace
        setProgress({ step: "Locating your workplace…", done: 0, total: 1 });
        const workplaceCoords = await geocode(preferences.workplace);
        if (!workplaceCoords) throw new Error(`Could not find workplace: "${preferences.workplace}"`);
        if (abortRef.current) return;

        // Step 2: Geocode each location (rate-limited)
        const total = staticLocations.length;
        const coordMap = {};

        for (let i = 0; i < staticLocations.length; i++) {
          if (abortRef.current) return;
          const loc = staticLocations[i];
          setProgress({ step: `Locating ${loc.name}…`, done: i, total });

          const coords = await geocode(loc.name);
          if (coords) coordMap[loc.id] = coords;

          // Only delay if not the last item
          if (i < staticLocations.length - 1) await sleep(RATE_DELAY_MS);
        }

        // Step 3: Batch commute times via OSRM (fast, no rate limit)
        if (abortRef.current) return;
        setProgress({ step: "Calculating commute times…", done: total, total });

        const locationCoords = staticLocations
          .filter((l) => coordMap[l.id])
          .map((l) => ({ id: l.id, ...coordMap[l.id] }));

        const commuteTimes = await batchCommuteToWorkplace(
          locationCoords,
          workplaceCoords.lat,
          workplaceCoords.lon,
          preferences.transport || "Car"
        );

        const commuteMap = {};
        commuteTimes.forEach(({ id, commute }) => {
          commuteMap[id] = commute;
        });

        // Step 4: Fetch amenity profiles via Overpass (parallel, with slight stagger)
        if (abortRef.current) return;
        setProgress({ step: "Fetching live amenity data…", done: total, total });

        const amenityResults = await Promise.all(
          staticLocations.map(async (loc, i) => {
            const coords = coordMap[loc.id];
            if (!coords) return { id: loc.id, amenityData: null };
            await sleep(i * 300); // stagger to avoid hammering Overpass
            const amenityData = await getAmenityProfile(coords.lat, coords.lon, 1500);
            return { id: loc.id, amenityData };
          })
        );

        const amenityMap = {};
        amenityResults.forEach(({ id, amenityData }) => {
          amenityMap[id] = amenityData;
        });

        // Step 5: Merge everything into enriched locations
        if (abortRef.current) return;

        const enriched = staticLocations.map((loc) => {
          const coords = coordMap[loc.id];
          const commute = commuteMap[loc.id] ?? loc.commute;
          const amenity = amenityMap[loc.id];

          return {
            ...loc,
            lat: coords?.lat ?? null,
            lon: coords?.lon ?? null,
            commute,
            // Override scores with live data if available
            amenities: amenity?.scores?.amenities ?? loc.amenities,
            transit: amenity?.scores?.transit ?? loc.transit,
            // Attach raw counts for display
            liveData: amenity
              ? {
                  healthcare: amenity.raw?.healthcare ?? 0,
                  education: amenity.raw?.education ?? 0,
                  grocery: amenity.raw?.grocery ?? 0,
                  food: amenity.raw?.food ?? 0,
                  leisure: amenity.raw?.leisure ?? 0,
                  transport: amenity.raw?.transport ?? 0,
                }
              : null,
            isLive: true,
          };
        });

        setLocations(enriched);
        setProgress({ step: "Done", done: total, total });
      } catch (err) {
        setError(err.message || "Failed to fetch live data");
        // Fall back to static data
        setLocations(staticLocations);
      } finally {
        if (!abortRef.current) setLoading(false);
      }
    }

    enrich();

    return () => {
      abortRef.current = true;
    };
  }, [preferences?.workplace, preferences?.transport]);

  return { locations, loading, progress, error };
}
