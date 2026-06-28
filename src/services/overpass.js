/**
 * Overpass API — live amenity counts.
 * In production routes through /api/overpass proxy.
 */

const IS_PROD = import.meta.env.PROD;
const OVERPASS_DIRECT = "https://overpass-api.de/api/interpreter";
const FETCH_TIMEOUT_MS = 12000;

async function postOverpass(query) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    let res;
    if (IS_PROD) {
      res = await fetch("/api/overpass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: query }),
        signal: controller.signal,
      });
    } else {
      res = await fetch(OVERPASS_DIRECT, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
    }
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function getAmenityProfile(lat, lon, radiusMeters = 1500) {
  const cacheKey = `amenity_profile_v2:${lat.toFixed(4)},${lon.toFixed(4)}:${radiusMeters}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

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
    const res = await postOverpass(query);
    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);

    const data = await res.json();
    const elements = data?.elements || [];

    const counts = { healthcare: 0, education: 0, grocery: 0, food: 0, leisure: 0, transport: 0 };

    for (const el of elements) {
      const amenity = el.tags?.amenity || "";
      const leisure = el.tags?.leisure || "";
      const pt = el.tags?.public_transport || "";

      if (/hospital|clinic|pharmacy|doctors/.test(amenity))            counts.healthcare++;
      else if (/school|college|university|kindergarten|library/.test(amenity)) counts.education++;
      else if (/supermarket|marketplace|convenience/.test(amenity))    counts.grocery++;
      else if (/restaurant|cafe|fast_food/.test(amenity))              counts.food++;
      else if (/park|fitness_centre|sports_centre/.test(leisure))      counts.leisure++;
      else if (/stop_position|station/.test(pt))                       counts.transport++;
    }

    const bounds = { healthcare: 15, education: 20, grocery: 15, food: 80, leisure: 20, transport: 10 };
    const scores = {};
    for (const [cat, count] of Object.entries(counts)) {
      scores[`${cat}Score`] = parseFloat(Math.min(10, (count / bounds[cat]) * 10).toFixed(1));
    }

    scores.amenities = parseFloat(
      ((scores.healthcareScore + scores.groceryScore + scores.foodScore) / 3).toFixed(1)
    );
    scores.transit = scores.transportScore;

    const result = { raw: counts, scores };
    sessionStorage.setItem(cacheKey, JSON.stringify(result));
    return result;
  } catch (err) {
    console.warn(`Overpass failed for (${lat},${lon}):`, err.message);
    return null;
  }
}
