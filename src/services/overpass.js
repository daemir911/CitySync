/**
 * OpenStreetMap Overpass API — fetches real amenity counts around a point.
 * Uses a SINGLE query per location to count all categories at once.
 */

const OVERPASS = "https://overpass-api.de/api/interpreter";
const FETCH_TIMEOUT_MS = 12000;

/** Fetch with a hard timeout */
async function fetchWithTimeout(url, options, ms = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch a full amenity profile for a neighbourhood in ONE Overpass query.
 * Returns scores object or null on failure.
 */
export async function getAmenityProfile(lat, lon, radiusMeters = 1500) {
  const cacheKey = `amenity_profile_v2:${lat.toFixed(4)},${lon.toFixed(4)}:${radiusMeters}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  // Single union query — counts everything in one round trip
  const query = `
[out:json][timeout:10];
(
  node["amenity"~"hospital|clinic|pharmacy|doctors"](around:${radiusMeters},${lat},${lon});
  node["amenity"~"school|college|university|kindergarten|library"](around:${radiusMeters},${lat},${lon});
  node["amenity"~"supermarket|marketplace|convenience"](around:${radiusMeters},${lat},${lon});
  node["amenity"~"restaurant|cafe|fast_food"](around:${radiusMeters},${lat},${lon});
  node["leisure"~"park|fitness_centre|sports_centre"](around:${radiusMeters},${lat},${lon});
  node["public_transport"~"stop_position|station"](around:${radiusMeters},${lat},${lon});
);
out tags;
`.trim();

  try {
    const res = await fetchWithTimeout(OVERPASS, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "User-Agent": "CitySync/1.0",
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
    const data = await res.json();
    const elements = data?.elements || [];

    // Classify each returned element
    const counts = { healthcare: 0, education: 0, grocery: 0, food: 0, leisure: 0, transport: 0 };

    for (const el of elements) {
      const amenity = el.tags?.amenity || "";
      const leisure = el.tags?.leisure || "";
      const pt = el.tags?.public_transport || "";

      if (/hospital|clinic|pharmacy|doctors/.test(amenity)) counts.healthcare++;
      else if (/school|college|university|kindergarten|library/.test(amenity)) counts.education++;
      else if (/supermarket|marketplace|convenience/.test(amenity)) counts.grocery++;
      else if (/restaurant|cafe|fast_food/.test(amenity)) counts.food++;
      else if (/park|fitness_centre|sports_centre/.test(leisure)) counts.leisure++;
      else if (/stop_position|station/.test(pt)) counts.transport++;
    }

    // Normalize to 0–10
    const bounds = { healthcare: 15, education: 20, grocery: 15, food: 80, leisure: 20, transport: 10 };
    const scores = {};
    for (const [cat, count] of Object.entries(counts)) {
      scores[`${cat}Score`] = parseFloat(Math.min(10, (count / bounds[cat]) * 10).toFixed(1));
    }

    // Composite amenity score = avg of healthcare + grocery + food
    scores.amenities = parseFloat(
      ((scores.healthcareScore + scores.groceryScore + scores.foodScore) / 3).toFixed(1)
    );
    scores.transit = scores.transportScore;

    const result = { raw: counts, scores };
    sessionStorage.setItem(cacheKey, JSON.stringify(result));
    return result;
  } catch (err) {
    // Timeout or network error — return null, caller falls back to static data
    console.warn(`Overpass failed for (${lat},${lon}):`, err.message);
    return null;
  }
}
