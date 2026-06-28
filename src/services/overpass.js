/**
 * Overpass API — live amenity counts with wider radii for better coverage.
 * In production routes through /api/overpass proxy.
 */

const IS_PROD = import.meta.env.PROD;
const OVERPASS_DIRECT = "https://overpass-api.de/api/interpreter";
const FETCH_TIMEOUT_MS = 14000;

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

/**
 * Fetch a rich amenity + infrastructure profile for a neighbourhood.
 * Uses wider radii for sparse Indian cities:
 *   - Amenities (shops, food, healthcare): 2km
 *   - Transit stops: 1km (walking distance)
 *   - Parks / green space: 2km
 *   - Education: 3km (kids can travel further)
 *   - Hospitals: 3km (emergency access)
 */
export async function getAmenityProfile(lat, lon) {
  const cacheKey = `amenity_v3:${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  // Single union query with category-specific radii
  const query = `
[out:json][timeout:15];
(
  node["amenity"~"hospital|clinic|pharmacy|doctors"](around:3000,${lat},${lon});
  node["amenity"~"school|college|university|kindergarten|library"](around:3000,${lat},${lon});
  node["amenity"~"supermarket|marketplace|convenience|grocery"](around:2000,${lat},${lon});
  node["shop"~"supermarket|convenience|grocery|mall|department_store"](around:2000,${lat},${lon});
  node["amenity"~"restaurant|cafe|fast_food|food_court|bar|pub"](around:2000,${lat},${lon});
  node["leisure"~"park|garden|playground|sports_centre|fitness_centre|stadium|swimming_pool"](around:2500,${lat},${lon});
  node["landuse"~"park|recreation_ground|grass|forest|meadow"](around:2500,${lat},${lon});
  node["public_transport"~"stop_position|station|platform"](around:1000,${lat},${lon});
  node["highway"~"bus_stop"](around:1000,${lat},${lon});
  node["railway"~"station|halt|tram_stop|subway_entrance"](around:1500,${lat},${lon});
  node["amenity"~"bank|atm|post_office|police|fire_station"](around:2000,${lat},${lon});
  node["shop"~"clothes|electronics|mobile_phone|furniture|hardware"](around:2000,${lat},${lon});
);
out tags;
`.trim();

  try {
    const res = await postOverpass(query);
    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);

    const data = await res.json();
    const elements = data?.elements || [];

    const counts = {
      healthcare: 0, education: 0, grocery: 0, food: 0,
      leisure: 0, transport: 0, services: 0, retail: 0,
    };

    for (const el of elements) {
      const amenity  = el.tags?.amenity  || "";
      const leisure  = el.tags?.leisure  || "";
      const landuse  = el.tags?.landuse  || "";
      const pt       = el.tags?.public_transport || "";
      const highway  = el.tags?.highway  || "";
      const railway  = el.tags?.railway  || "";
      const shop     = el.tags?.shop     || "";

      if (/hospital|clinic|pharmacy|doctors/.test(amenity))
        counts.healthcare++;
      else if (/school|college|university|kindergarten|library/.test(amenity))
        counts.education++;
      else if (/supermarket|marketplace|convenience|grocery/.test(amenity) ||
               /supermarket|convenience|grocery|mall|department_store/.test(shop))
        counts.grocery++;
      else if (/restaurant|cafe|fast_food|food_court|bar|pub/.test(amenity))
        counts.food++;
      else if (/park|garden|playground|sports_centre|fitness_centre|stadium|swimming_pool/.test(leisure) ||
               /park|recreation_ground|grass|forest|meadow/.test(landuse))
        counts.leisure++;
      else if (/stop_position|station|platform/.test(pt) ||
               highway === "bus_stop" ||
               /station|halt|tram_stop|subway_entrance/.test(railway))
        counts.transport++;
      else if (/bank|atm|post_office|police|fire_station/.test(amenity))
        counts.services++;
      else if (/clothes|electronics|mobile_phone|furniture|hardware/.test(shop))
        counts.retail++;
    }

    // Normalize — higher bounds since we're using wider radii
    const bounds = {
      healthcare: 20, education: 25, grocery: 25, food: 120,
      leisure: 30, transport: 15, services: 15, retail: 20,
    };
    const scores = {};
    for (const [cat, count] of Object.entries(counts)) {
      scores[`${cat}Score`] = parseFloat(Math.min(10, (count / bounds[cat]) * 10).toFixed(1));
    }

    // Composite scores
    scores.amenities = parseFloat(
      ((scores.healthcareScore * 1.5 + scores.groceryScore + scores.foodScore * 0.8 + scores.servicesScore) / 4.3).toFixed(1)
    );
    scores.transit  = parseFloat(Math.min(10, scores.transportScore * 1.2).toFixed(1));
    scores.parks    = scores.leisureScore;
    scores.retail   = scores.retailScore;

    // Walkability proxy: density of food + retail + grocery within 2km
    const walkabilityRaw = counts.food + counts.grocery + counts.retail;
    scores.walkability = parseFloat(Math.min(10, (walkabilityRaw / 60) * 10).toFixed(1));

    // Vitality proxy: total amenity density → indicates how developed the area is
    const totalAmenities = Object.values(counts).reduce((a, b) => a + b, 0);
    scores.vitality = parseFloat(Math.min(10, (totalAmenities / 150) * 10).toFixed(1));

    const result = { raw: counts, scores };
    sessionStorage.setItem(cacheKey, JSON.stringify(result));
    return result;
  } catch (err) {
    console.warn(`Overpass failed for (${lat},${lon}):`, err.message);
    return null;
  }
}
