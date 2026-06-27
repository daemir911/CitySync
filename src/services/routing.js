/**
 * Commute time via OSRM (Open Source Routing Machine) — free, no API key.
 * Supports: driving, cycling, foot (walking).
 * For transit (metro/bus) we use driving as a proxy and apply a factor.
 */

const OSRM_BASE = "https://router.project-osrm.org/route/v1";

// Maps user transport preference to OSRM profile + adjustment factor
const PROFILE_MAP = {
  Car: { profile: "driving", factor: 1.0 },
  Metro: { profile: "driving", factor: 1.2 }, // metro + walk approx
  Bus: { profile: "driving", factor: 1.5 },   // bus is slower than car
  Bike: { profile: "cycling", factor: 1.0 },
  Walk: { profile: "foot", factor: 1.0 },
};

/**
 * Get commute duration in minutes between two lat/lon points.
 * @param {number} fromLat
 * @param {number} fromLon
 * @param {number} toLat
 * @param {number} toLon
 * @param {string} transport - "Car" | "Metro" | "Bus" | "Bike"
 * @returns {Promise<number|null>} duration in minutes, or null on failure
 */
export async function getCommuteDuration(fromLat, fromLon, toLat, toLon, transport = "Car") {
  const cacheKey = `route:${fromLat.toFixed(4)},${fromLon.toFixed(4)}->${toLat.toFixed(4)},${toLon.toFixed(4)}:${transport}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const { profile, factor } = PROFILE_MAP[transport] || PROFILE_MAP["Car"];
  const url = `${OSRM_BASE}/${profile}/${fromLon},${fromLat};${toLon},${toLat}?overview=false`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.code !== "Ok" || !data.routes?.length) return null;

    const durationMin = Math.round((data.routes[0].duration / 60) * factor);
    sessionStorage.setItem(cacheKey, JSON.stringify(durationMin));
    return durationMin;
  } catch {
    return null;
  }
}

/**
 * Compute commute times from multiple neighbourhood coords to one workplace.
 * Returns array of { id, commute } in the same order as locations.
 */
export async function batchCommuteToWorkplace(locationCoords, workplaceLat, workplaceLon, transport) {
  const results = await Promise.all(
    locationCoords.map(async ({ id, lat, lon }) => {
      const commute = await getCommuteDuration(lat, lon, workplaceLat, workplaceLon, transport);
      return { id, commute };
    })
  );
  return results;
}
