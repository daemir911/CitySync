/**
 * Overpass API — live amenity counts using parallel focused queries.
 * Splitting into 3 small queries is much faster than one large union.
 * In production routes through /api/overpass proxy.
 */

const IS_PROD = import.meta.env.PROD;
const OVERPASS_DIRECT = "https://overpass-api.de/api/interpreter";
const FETCH_TIMEOUT_MS = 10000;

async function queryOverpass(query) {
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
      const url = `${OVERPASS_DIRECT}?data=${encodeURIComponent(query)}`;
      res = await fetch(url, {
        headers: { "Accept": "application/json" },
        signal: controller.signal,
      });
    }
    if (!res.ok) return 0;
    const data = await res.json();
    // Support both count response and full element list
    if (data?.elements?.[0]?.tags?.total !== undefined) {
      return parseInt(data.elements[0].tags.total, 10);
    }
    return data?.elements?.length ?? 0;
  } catch {
    return 0;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch amenity profile using 3 parallel focused queries.
 * Much faster than one large union which times out.
 */
export async function getAmenityProfile(lat, lon) {
  const cacheKey = `amenity_v4:${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const q = (filter, radius) =>
    `[out:json][timeout:8];(${filter});out count;`
      .replace(/\$r/g, radius)
      .replace(/\$lat/g, lat)
      .replace(/\$lon/g, lon);

  // 3 parallel queries — each fast enough to finish under 10s
  const [healthEdu, foodGrocery, transitLeisure] = await Promise.all([
    queryOverpass(
      `[out:json][timeout:8];(node["amenity"~"hospital|clinic|pharmacy|doctors"](around:3000,${lat},${lon});node["amenity"~"school|college|university|kindergarten|library"](around:3000,${lat},${lon}););out count;`
    ),
    queryOverpass(
      `[out:json][timeout:8];(node["amenity"~"restaurant|cafe|fast_food|food_court"](around:2000,${lat},${lon});node["amenity"~"supermarket|convenience|marketplace"](around:2000,${lat},${lon});node["shop"~"supermarket|convenience|mall"](around:2000,${lat},${lon}););out count;`
    ),
    queryOverpass(
      `[out:json][timeout:8];(node["highway"="bus_stop"](around:1200,${lat},${lon});node["railway"~"station|subway_entrance|halt"](around:1500,${lat},${lon});node["public_transport"="stop_position"](around:1200,${lat},${lon});node["leisure"~"park|garden|fitness_centre|playground"](around:2500,${lat},${lon}););out count;`
    ),
  ]);

  // Parse combined counts (we can't separate them from count queries)
  // So we estimate split: ~40% healthcare, ~60% education from first query
  const healthcareCount = Math.round(healthEdu * 0.4);
  const educationCount  = Math.round(healthEdu * 0.6);
  const foodCount       = Math.round(foodGrocery * 0.7);
  const groceryCount    = Math.round(foodGrocery * 0.3);
  const transitCount    = Math.round(transitLeisure * 0.5);
  const leisureCount    = Math.round(transitLeisure * 0.5);

  const raw = {
    healthcare: healthcareCount,
    education:  educationCount,
    grocery:    groceryCount,
    food:       foodCount,
    leisure:    leisureCount,
    transport:  transitCount,
  };

  // Normalize to 0–10
  const bounds = { healthcare: 15, education: 20, grocery: 15, food: 60, leisure: 20, transport: 10 };
  const scores = {};
  for (const [cat, count] of Object.entries(raw)) {
    scores[`${cat}Score`] = parseFloat(Math.min(10, (count / bounds[cat]) * 10).toFixed(1));
  }

  scores.amenities = parseFloat(
    ((scores.healthcareScore * 1.5 + scores.groceryScore + scores.foodScore * 0.8) / 3.3).toFixed(1)
  );
  scores.transit      = parseFloat(Math.min(10, scores.transportScore * 1.3).toFixed(1));
  scores.parks        = scores.leisureScore;
  scores.walkability  = parseFloat(Math.min(10, ((foodCount + groceryCount) / 40) * 10).toFixed(1));
  scores.vitality     = parseFloat(Math.min(10, ((healthEdu + foodGrocery + transitLeisure) / 120) * 10).toFixed(1));

  const result = { raw, scores };
  sessionStorage.setItem(cacheKey, JSON.stringify(result));
  return result;
}
