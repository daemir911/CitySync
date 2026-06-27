/**
 * Geocoding via Nominatim (OpenStreetMap) — free, no API key required.
 */

const NOMINATIM = "https://nominatim.openstreetmap.org";
const OVERPASS  = "https://overpass-api.de/api/interpreter";

function cacheKey(query) {
  return `nominatim:${query.toLowerCase().trim()}`;
}

/**
 * Convert a place name to { lat, lon, displayName }.
 */
export async function geocode(placeName) {
  const key = cacheKey(placeName);
  const cached = sessionStorage.getItem(key);
  if (cached) return JSON.parse(cached);

  const url = `${NOMINATIM}/search?q=${encodeURIComponent(placeName)}&format=json&limit=1&countrycodes=in`;

  try {
    const res = await fetch(url, { headers: { "User-Agent": "CitySync/1.0" } });
    const data = await res.json();
    if (!data.length) return null;

    const result = {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      displayName: data[0].display_name,
      boundingbox: data[0].boundingbox, // [south, north, west, east]
    };

    sessionStorage.setItem(key, JSON.stringify(result));
    return result;
  } catch {
    return null;
  }
}

/**
 * Find real neighbourhoods in any Indian city using:
 * 1. Nominatim to get the city bounding box
 * 2. Overpass to list suburb/neighbourhood nodes within that bbox
 *
 * Works for any city — Hyderabad, Nagpur, Pune, Jaipur, etc.
 */
export async function searchNeighbourhoods(cityName, limit = 10) {
  const key = `nh_v2:${cityName.toLowerCase().trim()}:${limit}`;
  const cached = sessionStorage.getItem(key);
  if (cached) return JSON.parse(cached);

  try {
    // Step 1: Get city coords + bounding box
    const geoUrl = `${NOMINATIM}/search?q=${encodeURIComponent(cityName + " India")}&format=json&limit=1&countrycodes=in&addressdetails=1`;
    const geoRes = await fetch(geoUrl, { headers: { "User-Agent": "CitySync/1.0" } });
    const geoData = await geoRes.json();

    if (!geoData.length) return [];

    const city = geoData[0];
    const bb = city.boundingbox; // [south, north, west, east]
    const cityLabel =
      city.address?.city ||
      city.address?.town ||
      city.address?.state_district ||
      cityName;

    // Slightly expand bbox to catch edge suburbs
    const south = parseFloat(bb[0]) - 0.05;
    const north = parseFloat(bb[1]) + 0.05;
    const west  = parseFloat(bb[2]) - 0.05;
    const east  = parseFloat(bb[3]) + 0.05;

    // Step 2: Overpass — find suburb/neighbourhood nodes in bbox
    const query = `[out:json][timeout:15];(node["place"~"suburb|neighbourhood|quarter|residential"](${south},${west},${north},${east}););out ${limit * 2};`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    const ovRes = await fetch(OVERPASS, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const ovData = await ovRes.json();
    const elements = ovData?.elements || [];

    if (!elements.length) return [];

    // Deduplicate by name
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
        // Placeholder scores — overwritten by live Overpass amenity data
        rent: 0,
        commute: 0,
        safety: 7,
        transit: 7,
        amenities: 7,
        schools: 7,
        parks: 7,
        nightlife: 6,
        familyFriendly: 7,
        coupleFriendly: 7,
        studentFriendly: 7,
        description: `A neighbourhood in ${cityLabel}.`,
        highlights: [],
        nearbyLandmarks: [],
        transportOptions: [],
        isDynamic: true,
      });

      if (results.length >= limit) break;
    }

    if (results.length) {
      sessionStorage.setItem(key, JSON.stringify(results));
    }
    return results;
  } catch (err) {
    console.warn("searchNeighbourhoods failed:", err.message);
    return [];
  }
}
