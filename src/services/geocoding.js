/**
 * Geocoding via Nominatim.
 * In production (Vercel) routes through /api/nominatim proxy to add User-Agent.
 * In development hits Nominatim directly.
 */

const IS_PROD = import.meta.env.PROD;
const NOMINATIM_DIRECT = "https://nominatim.openstreetmap.org";
const OVERPASS_DIRECT  = "https://overpass-api.de/api/interpreter";

function nominatimUrl(params) {
  if (IS_PROD) return `/api/nominatim?${params}`;
  return `${NOMINATIM_DIRECT}/search?${params}`;
}

function cacheKey(query) {
  return `nominatim:${query.toLowerCase().trim()}`;
}

export async function geocode(placeName) {
  const key = cacheKey(placeName);
  const cached = sessionStorage.getItem(key);
  if (cached) return JSON.parse(cached);

  const params = new URLSearchParams({
    q: placeName,
    format: "json",
    limit: "1",
    countrycodes: "in",
  }).toString();

  try {
    const res = await fetch(nominatimUrl(params), {
      headers: { "Accept": "application/json" },
    });
    const data = await res.json();
    if (!data.length) return null;

    const result = {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      displayName: data[0].display_name,
      boundingbox: data[0].boundingbox,
    };

    sessionStorage.setItem(key, JSON.stringify(result));
    return result;
  } catch {
    return null;
  }
}

export async function searchNeighbourhoods(cityName, limit = 10) {
  const key = `nh_v2:${cityName.toLowerCase().trim()}:${limit}`;
  const cached = sessionStorage.getItem(key);
  if (cached) return JSON.parse(cached);

  try {
    // Step 1: Get city bounding box
    const geoParams = new URLSearchParams({
      q: `${cityName} India`,
      format: "json",
      limit: "1",
      countrycodes: "in",
      addressdetails: "1",
    }).toString();

    const geoRes = await fetch(nominatimUrl(geoParams), {
      headers: { "Accept": "application/json" },
    });
    const geoData = await geoRes.json();
    if (!geoData.length) return [];

    const city = geoData[0];
    const bb = city.boundingbox;
    const cityLabel =
      city.address?.city ||
      city.address?.town ||
      city.address?.state_district ||
      cityName;

    const south = parseFloat(bb[0]) - 0.05;
    const north = parseFloat(bb[1]) + 0.05;
    const west  = parseFloat(bb[2]) - 0.05;
    const east  = parseFloat(bb[3]) + 0.05;

    // Step 2: Overpass bbox query for suburbs
    const query = `[out:json][timeout:15];(node["place"~"suburb|neighbourhood|quarter|residential"](${south},${west},${north},${east}););out ${limit * 2};`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    let ovRes;
    if (IS_PROD) {
      ovRes = await fetch("/api/overpass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: query }),
        signal: controller.signal,
      });
    } else {
      ovRes = await fetch(OVERPASS_DIRECT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
    }
    clearTimeout(timer);

    const ovData = await ovRes.json();
    const elements = ovData?.elements || [];
    if (!elements.length) return [];

    const seen = new Set();
    const results = [];

    for (const el of elements) {
      const name = el.tags?.name;
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());

      results.push({
        id: `dyn_${el.id}`,
        name: `${name}, ${cityLabel}`,
        city: cityLabel,
        lat: el.lat,
        lon: el.lon,
        rent: 0, commute: 0,
        safety: 7, transit: 7, amenities: 7,
        schools: 7, parks: 7, nightlife: 6,
        familyFriendly: 7, coupleFriendly: 7, studentFriendly: 7,
        description: `A neighbourhood in ${cityLabel}.`,
        highlights: [], nearbyLandmarks: [], transportOptions: [],
        isDynamic: true,
      });

      if (results.length >= limit) break;
    }

    if (results.length) sessionStorage.setItem(key, JSON.stringify(results));
    return results;
  } catch (err) {
    console.warn("searchNeighbourhoods failed:", err.message);
    return [];
  }
}
